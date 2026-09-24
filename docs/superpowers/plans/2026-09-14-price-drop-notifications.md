# Price-Drop Wishlist Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a seller lowers a listing's price, every user who has that listing saved (wishlisted) gets a real, persisted, per-user notification — replacing the current 100%-mock notification dropdown.

**Architecture:** A new `Notification` entity/table + `NotificationService` (mirrors the existing `SavedItemService` pattern) is called directly from `ListingController.updateListing`'s existing price-drop branch. A new `NotificationController` exposes it over REST. The frontend `Notifications.tsx` dropdown swaps its hardcoded mock array for real fetches against that API.

**Tech Stack:** Spring Boot 4.1 / JPA / H2 (backend, unchanged), React + TypeScript + axios (frontend, unchanged). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-14-price-drop-notifications-design.md`

## Global Constraints

- No real-time/live push — notifications are fetched on page load and whenever the bell dropdown opens (`docs/superpowers/specs/2026-09-14-price-drop-notifications-design.md`, "Non-goals").
- Only `PRICE_DROP` notifications exist; the mock "order"/"rating" types are deleted, not ported.
- No historical backfill — only price drops that happen after this ships create notifications.
- A seller who has saved their own listing does not get notified about their own price change.
- Clicking a price-drop notification marks it read and navigates to `/items/{relatedListingId}`.

---

### Task 1: `NotificationService` — create, fetch, and mark-as-read logic

**Files:**
- Create: `chasel/src/main/java/com/app/chasel/model/NotificationType.java`
- Create: `chasel/src/main/java/com/app/chasel/model/Notification.java`
- Create: `chasel/src/main/java/com/app/chasel/repository/NotificationRepository.java`
- Modify: `chasel/src/main/java/com/app/chasel/repository/SavedItemRepository.java`
- Create: `chasel/src/main/java/com/app/chasel/service/NotificationService.java`
- Test: `chasel/src/test/java/com/app/chasel/service/NotificationServiceTest.java`

**Interfaces:**
- Produces: `NotificationService.notifyPriceDrop(Listing listing): void`, `NotificationService.getNotifications(Users user): List<Notification>`, `NotificationService.markAsRead(Long notificationId, Users user): void`, `NotificationService.markAllAsRead(Users user): void`. `Notification` getters: `getId()`, `getUser()`, `getType()`, `getTitle()`, `getMessage()`, `getRelatedListingId()`, `isRead()`, `getCreatedAt()`. `SavedItemRepository.findByProduct(Listing product): List<SavedItem>`.
- Consumes (already exist): `Listing.getSeller()`, `Listing.getId()`, `Listing.getTitle()`, `Listing.getPrice()`, `Listing.getPreviousPrice()`; `SavedItem.getUser()`; `Users.getId()`.

- [ ] **Step 1: Write the failing test**

Create `chasel/src/test/java/com/app/chasel/service/NotificationServiceTest.java`:

```java
package com.app.chasel.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.app.chasel.model.Listing;
import com.app.chasel.model.ListingStatus;
import com.app.chasel.model.Notification;
import com.app.chasel.model.SavedItem;
import com.app.chasel.model.Users;
import com.app.chasel.repository.ListingRepository;
import com.app.chasel.repository.SavedItemRepository;
import com.app.chasel.repository.UserRepository;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class NotificationServiceTest {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private SavedItemRepository savedItemRepository;

    private Users createUser(String emailPrefix) {
        Users user = new Users();
        user.setEmail(emailPrefix + "-" + System.nanoTime() + "@example.com");
        user.setPassword("irrelevant-hash");
        return userRepository.save(user);
    }

    private Listing createListing(Users seller, double price) {
        Listing listing = new Listing();
        listing.setTitle("Test Jacket");
        listing.setBrand("Test Brand");
        listing.setCategory("Clothing");
        listing.setPrice(price);
        listing.setStatus(ListingStatus.ACTIVE);
        listing.setSeller(seller);
        return listingRepository.save(listing);
    }

    private void saveForUser(Users user, Listing listing) {
        SavedItem savedItem = new SavedItem();
        savedItem.setUser(user);
        savedItem.setProduct(listing);
        savedItemRepository.save(savedItem);
    }

    @Test
    void notifyPriceDropCreatesANotificationForEachWatcherExceptTheSeller() {
        Users seller = createUser("seller");
        Listing listing = createListing(seller, 80.0);
        listing.setPreviousPrice(100.0);
        listingRepository.save(listing);

        Users watcherOne = createUser("watcher-one");
        Users watcherTwo = createUser("watcher-two");
        saveForUser(watcherOne, listing);
        saveForUser(watcherTwo, listing);
        saveForUser(seller, listing); // seller also saved their own listing

        notificationService.notifyPriceDrop(listing);

        List<Notification> watcherOneNotifications = notificationService.getNotifications(watcherOne);
        List<Notification> watcherTwoNotifications = notificationService.getNotifications(watcherTwo);
        List<Notification> sellerNotifications = notificationService.getNotifications(seller);

        assertEquals(1, watcherOneNotifications.size());
        assertEquals(1, watcherTwoNotifications.size());
        assertEquals(0, sellerNotifications.size());

        Notification notification = watcherOneNotifications.get(0);
        assertEquals("Price drop", notification.getTitle());
        assertEquals("\"Test Jacket\" dropped from $100.00 to $80.00.", notification.getMessage());
        assertEquals(listing.getId(), notification.getRelatedListingId());
        assertFalse(notification.isRead());
    }

    @Test
    void notifyPriceDropDoesNothingForUsersWhoHaventSavedTheListing() {
        Users seller = createUser("seller");
        Listing listing = createListing(seller, 80.0);
        listing.setPreviousPrice(100.0);
        listingRepository.save(listing);

        Users uninvolvedUser = createUser("uninvolved");

        notificationService.notifyPriceDrop(listing);

        assertTrue(notificationService.getNotifications(uninvolvedUser).isEmpty());
    }

    @Test
    void markAsReadMarksTheCallersOwnNotification() {
        Users seller = createUser("seller");
        Listing listing = createListing(seller, 80.0);
        listing.setPreviousPrice(100.0);
        listingRepository.save(listing);

        Users watcher = createUser("watcher");
        saveForUser(watcher, listing);
        notificationService.notifyPriceDrop(listing);

        Notification notification = notificationService.getNotifications(watcher).get(0);
        assertFalse(notification.isRead());

        notificationService.markAsRead(notification.getId(), watcher);

        Notification reloaded = notificationService.getNotifications(watcher).get(0);
        assertTrue(reloaded.isRead());
    }

    @Test
    void markAsReadRejectsSomeoneElsesNotification() {
        Users seller = createUser("seller");
        Listing listing = createListing(seller, 80.0);
        listing.setPreviousPrice(100.0);
        listingRepository.save(listing);

        Users watcher = createUser("watcher");
        Users stranger = createUser("stranger");
        saveForUser(watcher, listing);
        notificationService.notifyPriceDrop(listing);

        Notification notification = notificationService.getNotifications(watcher).get(0);

        assertThrows(RuntimeException.class, () ->
                notificationService.markAsRead(notification.getId(), stranger));
    }

    @Test
    void markAllAsReadOnlyAffectsTheCallersNotifications() {
        Users seller = createUser("seller");
        Listing listing = createListing(seller, 80.0);
        listing.setPreviousPrice(100.0);
        listingRepository.save(listing);

        Users watcherOne = createUser("watcher-one");
        Users watcherTwo = createUser("watcher-two");
        saveForUser(watcherOne, listing);
        saveForUser(watcherTwo, listing);
        notificationService.notifyPriceDrop(listing);

        notificationService.markAllAsRead(watcherOne);

        assertTrue(notificationService.getNotifications(watcherOne).get(0).isRead());
        assertFalse(notificationService.getNotifications(watcherTwo).get(0).isRead());
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd chasel && ./mvnw test -Dtest=NotificationServiceTest`
Expected: compile failure — `NotificationService`, `Notification`, `NotificationType` don't exist yet.

- [ ] **Step 3: Create `NotificationType`**

`chasel/src/main/java/com/app/chasel/model/NotificationType.java`:

```java
package com.app.chasel.model;

public enum NotificationType {
    PRICE_DROP
}
```

- [ ] **Step 4: Create the `Notification` entity**

`chasel/src/main/java/com/app/chasel/model/Notification.java`:

```java
package com.app.chasel.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 1000)
    private String message;

    // Nullable: future notification types might not point at a listing.
    private Long relatedListingId;

    @Column(nullable = false)
    private boolean read = false;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Users getUser() {
        return user;
    }

    public void setUser(Users user) {
        this.user = user;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getRelatedListingId() {
        return relatedListingId;
    }

    public void setRelatedListingId(Long relatedListingId) {
        this.relatedListingId = relatedListingId;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
```

- [ ] **Step 5: Create `NotificationRepository`**

`chasel/src/main/java/com/app/chasel/repository/NotificationRepository.java`:

```java
package com.app.chasel.repository;

import com.app.chasel.model.Notification;
import com.app.chasel.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserOrderByCreatedAtDesc(Users user);
}
```

- [ ] **Step 6: Add `findByProduct` to `SavedItemRepository`**

In `chasel/src/main/java/com/app/chasel/repository/SavedItemRepository.java`, add this method to the interface (alongside the existing `findByUserAndProduct`/`deleteByProduct`):

```java
    List<SavedItem> findByProduct(Listing product);
```

- [ ] **Step 7: Create `NotificationService`**

`chasel/src/main/java/com/app/chasel/service/NotificationService.java`:

```java
package com.app.chasel.service;

import com.app.chasel.model.Listing;
import com.app.chasel.model.Notification;
import com.app.chasel.model.NotificationType;
import com.app.chasel.model.SavedItem;
import com.app.chasel.model.Users;
import com.app.chasel.repository.NotificationRepository;
import com.app.chasel.repository.SavedItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SavedItemRepository savedItemRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            SavedItemRepository savedItemRepository) {
        this.notificationRepository = notificationRepository;
        this.savedItemRepository = savedItemRepository;
    }

    public void notifyPriceDrop(Listing listing) {
        List<SavedItem> watchers = savedItemRepository.findByProduct(listing);

        for (SavedItem watcher : watchers) {
            Users recipient = watcher.getUser();

            if (recipient.getId().equals(listing.getSeller().getId())) {
                continue;
            }

            Notification notification = new Notification();
            notification.setUser(recipient);
            notification.setType(NotificationType.PRICE_DROP);
            notification.setTitle("Price drop");
            notification.setMessage(buildPriceDropMessage(listing));
            notification.setRelatedListingId(listing.getId());
            notificationRepository.save(notification);
        }
    }

    public List<Notification> getNotifications(Users user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public void markAsRead(Long notificationId, Users user) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized to update this notification");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    public void markAllAsRead(Users user) {
        List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
        notifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(notifications);
    }

    private String buildPriceDropMessage(Listing listing) {
        return "\"%s\" dropped from $%.2f to $%.2f.".formatted(
                listing.getTitle(), listing.getPreviousPrice(), listing.getPrice()
        );
    }
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `cd chasel && ./mvnw test -Dtest=NotificationServiceTest`
Expected: `Tests run: 5, Failures: 0, Errors: 0`

- [ ] **Step 9: Run the full backend suite to check for regressions**

Run: `cd chasel && ./mvnw test`
Expected: all tests pass (9 existing + 5 new = 14).

- [ ] **Step 10: Commit**

```bash
git add chasel/src/main/java/com/app/chasel/model/NotificationType.java \
        chasel/src/main/java/com/app/chasel/model/Notification.java \
        chasel/src/main/java/com/app/chasel/repository/NotificationRepository.java \
        chasel/src/main/java/com/app/chasel/repository/SavedItemRepository.java \
        chasel/src/main/java/com/app/chasel/service/NotificationService.java \
        chasel/src/test/java/com/app/chasel/service/NotificationServiceTest.java
git commit -m "feat(notifications): add Notification entity and NotificationService"
```

---

### Task 2: Wire the price-drop trigger into `ListingController`

**Files:**
- Modify: `chasel/src/main/java/com/app/chasel/controller/ListingController.java`
- Test: `chasel/src/test/java/com/app/chasel/controller/ListingPriceDropTest.java`

**Interfaces:**
- Consumes: `NotificationService.notifyPriceDrop(Listing listing): void` (Task 1). `SavedItemRepository`, `NotificationRepository` (both already exist — the latter from Task 1) for test setup/assertions.
- Produces: nothing new for later tasks — this task only connects two already-built pieces.

- [ ] **Step 1: Write the failing test**

Read the current `chasel/src/test/java/com/app/chasel/controller/ListingPriceDropTest.java` first (it already has `@BeforeEach seedListing()`, `sellerToken`, `listingId`, and `updatePayload(double)` you'll reuse). Add these imports:

```java
import com.app.chasel.model.Notification;
import com.app.chasel.model.SavedItem;
import com.app.chasel.repository.NotificationRepository;
import com.app.chasel.repository.SavedItemRepository;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
```

Add these two `@Autowired` fields alongside the existing ones:

```java
    @Autowired
    private SavedItemRepository savedItemRepository;

    @Autowired
    private NotificationRepository notificationRepository;
```

Add this test method to the class:

```java
    @Test
    void loweringPriceNotifiesUsersWhoSavedTheListing() throws Exception {
        Users watcher = new Users();
        watcher.setEmail("watcher-" + System.nanoTime() + "@example.com");
        watcher.setPassword("irrelevant-hash");
        watcher = userRepository.save(watcher);

        Listing listing = listingRepository.findById(listingId).orElseThrow();
        SavedItem savedItem = new SavedItem();
        savedItem.setUser(watcher);
        savedItem.setProduct(listing);
        savedItemRepository.save(savedItem);

        mockMvc.perform(put("/api/listings/" + listingId)
                        .header("Authorization", "Bearer " + sellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload(80.0)))
                .andExpect(status().isOk());

        List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(watcher);
        assertEquals(1, notifications.size());
        assertEquals("Price drop", notifications.get(0).getTitle());
        assertEquals(listingId, notifications.get(0).getRelatedListingId());
    }
```

`Users` and `Listing` are already imported in this file (used by `seedListing()`); `userRepository` and `listingRepository` are already autowired fields.

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd chasel && ./mvnw test -Dtest=ListingPriceDropTest#loweringPriceNotifiesUsersWhoSavedTheListing`
Expected: FAIL — 0 notifications created, since nothing calls `NotificationService` yet.

- [ ] **Step 3: Wire `NotificationService` into `ListingController`**

In `chasel/src/main/java/com/app/chasel/controller/ListingController.java`:

Add the import:

```java
import com.app.chasel.service.NotificationService;
```

Add the field and constructor parameter:

```java
    private final NotificationService notificationService;
```

```java
    public ListingController(
            ListingRepository listingRepository,
            UserRepository userRepository,
            CartItemRepository cartItemRepository,
            SavedItemRepository savedItemRepository,
            ProductImageRepository productImageRepository,
            NotificationService notificationService) {
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.cartItemRepository = cartItemRepository;
        this.savedItemRepository = savedItemRepository;
        this.productImageRepository = productImageRepository;
        this.notificationService = notificationService;
    }
```

Replace the body of `updateListing` from the price-drop comment through the final `return` with:

```java
        // Track price drops so the frontend can show "was $X", and notify
        // anyone watching this listing. A price that goes back up (or
        // stays the same) is no longer a markdown.
        boolean priceDropped = request.getPrice() < listing.getPrice();
        if (priceDropped) {
            listing.setPreviousPrice(listing.getPrice());
        } else {
            listing.setPreviousPrice(null);
        }
        listing.setPrice(request.getPrice());

        if (request.getImageUrls() != null) {
            listing.setImageUrls(request.getImageUrls());
        }
        if (request.getLocation() != null) {
            listing.setLocation(request.getLocation());
        }

        Listing saved = listingRepository.save(listing);

        if (priceDropped) {
            notificationService.notifyPriceDrop(saved);
        }

        return saved;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd chasel && ./mvnw test -Dtest=ListingPriceDropTest`
Expected: `Tests run: 4, Failures: 0, Errors: 0` (the 3 existing price-drop tests plus the new one).

- [ ] **Step 5: Run the full backend suite**

Run: `cd chasel && ./mvnw test`
Expected: all tests pass (14 existing + 1 new = 15).

- [ ] **Step 6: Commit**

```bash
git add chasel/src/main/java/com/app/chasel/controller/ListingController.java \
        chasel/src/test/java/com/app/chasel/controller/ListingPriceDropTest.java
git commit -m "feat(listings): notify watchers when a listing's price drops"
```

---

### Task 3: `NotificationController` REST endpoints

**Files:**
- Create: `chasel/src/main/java/com/app/chasel/dto/NotificationResponse.java`
- Create: `chasel/src/main/java/com/app/chasel/controller/NotificationController.java`
- Modify: `chasel/src/main/java/com/app/chasel/config/SecurityConfig.java`
- Test: `chasel/src/test/java/com/app/chasel/controller/NotificationControllerTest.java`

**Interfaces:**
- Consumes: `NotificationService` (Task 1) — `getNotifications`, `markAsRead`, `markAllAsRead`.
- Produces: `GET /api/notifications` (auth required, returns `NotificationResponse[]`), `PATCH /api/notifications/{id}/read`, `PATCH /api/notifications/read-all` — these three exact routes are what Task 4's frontend code calls.

- [ ] **Step 1: Write the failing test**

Create `chasel/src/test/java/com/app/chasel/controller/NotificationControllerTest.java`:

```java
package com.app.chasel.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import com.app.chasel.model.Listing;
import com.app.chasel.model.ListingStatus;
import com.app.chasel.model.Notification;
import com.app.chasel.model.NotificationType;
import com.app.chasel.model.Users;
import com.app.chasel.repository.ListingRepository;
import com.app.chasel.repository.NotificationRepository;
import com.app.chasel.repository.UserRepository;
import com.app.chasel.security.JwtUtil;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private Users seller;
    private Listing listing;
    private String watcherToken;
    private Notification watcherNotification;

    @BeforeEach
    void seedData() {
        seller = new Users();
        seller.setEmail("seller-" + System.nanoTime() + "@example.com");
        seller.setPassword("irrelevant-hash");
        seller = userRepository.save(seller);

        listing = new Listing();
        listing.setTitle("Test Jacket");
        listing.setBrand("Test Brand");
        listing.setCategory("Clothing");
        listing.setPrice(80.0);
        listing.setPreviousPrice(100.0);
        listing.setStatus(ListingStatus.ACTIVE);
        listing.setSeller(seller);
        listing = listingRepository.save(listing);

        Users watcher = new Users();
        watcher.setEmail("watcher-" + System.nanoTime() + "@example.com");
        watcher.setPassword("irrelevant-hash");
        watcher = userRepository.save(watcher);
        watcherToken = jwtUtil.generateToken(watcher.getEmail());

        watcherNotification = new Notification();
        watcherNotification.setUser(watcher);
        watcherNotification.setType(NotificationType.PRICE_DROP);
        watcherNotification.setTitle("Price drop");
        watcherNotification.setMessage("\"Test Jacket\" dropped from $100.00 to $80.00.");
        watcherNotification.setRelatedListingId(listing.getId());
        watcherNotification = notificationRepository.save(watcherNotification);
    }

    @Test
    void getNotificationsReturnsOnlyTheCallersOwn() throws Exception {
        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + watcherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Price drop"))
                .andExpect(jsonPath("$[0].relatedListingId").value(listing.getId()))
                .andExpect(jsonPath("$[0].read").value(false));
    }

    @Test
    void anonymousCannotListNotifications() throws Exception {
        mockMvc.perform(get("/api/notifications"))
                .andExpect(status().isForbidden());
    }

    @Test
    void markAsReadPersists() throws Exception {
        mockMvc.perform(patch("/api/notifications/" + watcherNotification.getId() + "/read")
                        .header("Authorization", "Bearer " + watcherToken))
                .andExpect(status().isOk());

        Notification reloaded = notificationRepository.findById(watcherNotification.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertTrue(reloaded.isRead());
    }

    @Test
    void markAllAsReadPersists() throws Exception {
        mockMvc.perform(patch("/api/notifications/read-all")
                        .header("Authorization", "Bearer " + watcherToken))
                .andExpect(status().isOk());

        Notification reloaded = notificationRepository.findById(watcherNotification.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertTrue(reloaded.isRead());
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd chasel && ./mvnw test -Dtest=NotificationControllerTest`
Expected: compile failure — `NotificationController` doesn't exist.

- [ ] **Step 3: Create the `NotificationResponse` DTO**

`chasel/src/main/java/com/app/chasel/dto/NotificationResponse.java`:

```java
package com.app.chasel.dto;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        String type,
        String title,
        String message,
        Long relatedListingId,
        boolean read,
        LocalDateTime createdAt
) {
}
```

- [ ] **Step 4: Create `NotificationController`**

`chasel/src/main/java/com/app/chasel/controller/NotificationController.java`:

```java
package com.app.chasel.controller;

import com.app.chasel.dto.NotificationResponse;
import com.app.chasel.model.Notification;
import com.app.chasel.model.Users;
import com.app.chasel.repository.UserRepository;
import com.app.chasel.service.NotificationService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public NotificationController(
            NotificationService notificationService,
            UserRepository userRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<NotificationResponse> getNotifications(Authentication authentication) {
        Users user = getUser(authentication);
        return notificationService.getNotifications(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @PatchMapping("/{id}/read")
    public void markAsRead(@PathVariable Long id, Authentication authentication) {
        Users user = getUser(authentication);
        notificationService.markAsRead(id, user);
    }

    @PatchMapping("/read-all")
    public void markAllAsRead(Authentication authentication) {
        Users user = getUser(authentication);
        notificationService.markAllAsRead(user);
    }

    private Users getUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType().name(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getRelatedListingId(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
```

- [ ] **Step 5: Allow `PATCH` in CORS config**

The frontend will call `PATCH` from `http://localhost:5173`, but `SecurityConfig.corsConfigurationSource()` currently only allows `GET, POST, PUT, DELETE, OPTIONS` — a real browser's CORS preflight would reject the new endpoints even though `NotificationControllerTest` (which doesn't send an `Origin` header) wouldn't catch this.

In `chasel/src/main/java/com/app/chasel/config/SecurityConfig.java`, change:

```java
        configuration.setAllowedMethods(
            Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS")
        );
```

to:

```java
        configuration.setAllowedMethods(
            Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        );
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd chasel && ./mvnw test -Dtest=NotificationControllerTest`
Expected: `Tests run: 4, Failures: 0, Errors: 0`

- [ ] **Step 7: Run the full backend suite**

Run: `cd chasel && ./mvnw test`
Expected: all tests pass (15 existing + 4 new = 19).

- [ ] **Step 8: Commit**

```bash
git add chasel/src/main/java/com/app/chasel/dto/NotificationResponse.java \
        chasel/src/main/java/com/app/chasel/controller/NotificationController.java \
        chasel/src/main/java/com/app/chasel/config/SecurityConfig.java \
        chasel/src/test/java/com/app/chasel/controller/NotificationControllerTest.java
git commit -m "feat(notifications): add GET/PATCH notification endpoints"
```

---

### Task 4: Frontend — real notifications in the dropdown

**Files:**
- Modify: `chasel-frontend/src/pages/Notifications.tsx`

**Interfaces:**
- Consumes: `GET /api/notifications` → `{ id, type, title, message, relatedListingId, read, createdAt }[]`; `PATCH /api/notifications/{id}/read`; `PATCH /api/notifications/read-all` (Task 3). `api` from `../api/axios` (existing shared instance). `useNavigate` from `react-router-dom`.
- Produces: no change to this component's props (`open`, `onClose`, `onUnreadCountChange` stay identical) — `Navbar.tsx` needs zero changes.

- [ ] **Step 1: Replace the mock data and component body**

Replace the entire contents of `chasel-frontend/src/pages/Notifications.tsx` with:

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Notifications.css';

interface ApiNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  relatedListingId: number | null;
  read: boolean;
  createdAt: string;
}

function typeIcon(type: string): string {
  if (type === 'PRICE_DROP') return '🏷️';
  return '🔔';
}

function formatRelativeTime(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

interface NotificationsProps {
  open: boolean;
  onClose: () => void;
  onUnreadCountChange: (count: number) => void;
}

function Notifications({ open, onClose, onUnreadCountChange }: NotificationsProps) {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const navigate = useNavigate();

  // Fires on mount (so the bell badge is right without opening the
  // dropdown) and again every time the dropdown opens, since there's no
  // live push — reopening is how a new notification actually shows up.
  useEffect(() => {
    api
      .get<ApiNotification[]>('/notifications')
      .then((res) => setNotifications(res.data))
      .catch((error) => console.error('Could not load notifications:', error));
  }, [open]);

  useEffect(() => {
    onUnreadCountChange(notifications.filter((n) => !n.read).length);
  }, [notifications, onUnreadCountChange]);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);

  const markAsRead = (id: number) => {
    setNotifications((current) =>
      current.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    api.patch(`/notifications/${id}/read`).catch((error) => {
      console.error('Could not mark notification as read:', error);
    });
  };

  const markAllAsRead = () => {
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));
    api.patch('/notifications/read-all').catch((error) => {
      console.error('Could not mark notifications as read:', error);
    });
  };

  const openNotification = (notification: ApiNotification) => {
    markAsRead(notification.id);
    if (notification.relatedListingId) {
      onClose();
      navigate(`/items/${notification.relatedListingId}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!open) return null;

  return (
    <div className="notifications-dropdown" aria-label="Notifications">
      <header className="notifications-dropdown-header">
        <h2>Notifications</h2>
        {unreadCount > 0 && (
          <button type="button" className="mark-all-btn" onClick={markAllAsRead}>
            Mark all as read
          </button>
        )}
      </header>

      <div className="notifications-dropdown-list">
        {notifications.length === 0 ? (
          <div className="notifications-empty">
            <div className="notifications-empty-icon">🔔</div>
            <p>You're all caught up.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <article
              key={notification.id}
              className={`notification-card ${notification.read ? '' : 'unread'}`}
              onClick={() => openNotification(notification)}
            >
              <div className="notification-icon notification-icon-general">
                {typeIcon(notification.type)}
              </div>

              <div className="notification-body">
                <div className="notification-title-row">
                  <h3>{notification.title}</h3>
                  <span className="notification-time">{formatRelativeTime(notification.createdAt)}</span>
                </div>
                <p>{notification.message}</p>
              </div>

              {!notification.read && <span className="unread-dot" />}
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default Notifications;
```

This drops the `order`/`rating` mock types entirely — `notification-icon-general` (already styled in `Notifications.css`, unchanged) is reused as the one icon background for now.

- [ ] **Step 2: Build and lint**

Run: `cd chasel-frontend && npm run build`
Expected: builds clean.

Run: `npm run lint`
Expected: no new errors in `Notifications.tsx` (compare against the pre-existing baseline of unrelated errors in `Cart.tsx`, `Tasks.tsx`, etc. — those are not this task's concern).

- [ ] **Step 3: Verify end-to-end in a real browser**

Start both servers (from repo root):

```bash
cd chasel && ./mvnw spring-boot:run &
cd chasel-frontend && npm run dev &
```

Wait for both to be reachable (`curl -sf http://localhost:8080/api/listings`, `curl -sf http://localhost:5173`), then run this Playwright script (adjust the `shotsDir` path or drop the screenshot lines if you don't need them) from inside `chasel-frontend/` (where `playwright` must be installed — `npm install --no-save playwright && npx playwright install chromium` if not):

```js
// verify-price-drop-notification.mjs
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const consoleErrors = [];
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

await page.goto('http://localhost:5173/browsing', { waitUntil: 'networkidle' });

// Register a seller + a watcher, create a listing, save it as the watcher.
const seed = await page.evaluate(async () => {
  const register = async (email) => {
    const res = await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'Password123!', firstName: 'T', lastName: 'User' }),
    });
    return (await res.json()).token;
  };

  const sellerToken = await register(`seller-${Date.now()}@example.com`);
  const watcherToken = await register(`watcher-${Date.now()}@example.com`);

  const listingRes = await fetch('http://localhost:8080/api/listings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sellerToken}` },
    body: JSON.stringify({ title: 'Notif Test Coat', brand: 'Test', category: 'Clothing', price: 200, condition: 'Good' }),
  });
  const listing = await listingRes.json();

  await fetch(`http://localhost:8080/api/saved-items/${listing.id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${watcherToken}` },
  });

  return { sellerToken, watcherToken, listingId: listing.id };
});

// Log in as the watcher first, confirm zero notifications.
await page.evaluate((t) => localStorage.setItem('token', t), seed.watcherToken);
await page.goto('http://localhost:5173/browsing', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const badgeCountBefore = await page.locator('.navbar-notifications-menu .badge').count();
console.log('Badge count before price drop (expect 0):', badgeCountBefore);

// Drop the price as the seller.
await page.evaluate(async ({ sellerToken, listingId }) => {
  await fetch(`http://localhost:8080/api/listings/${listingId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sellerToken}` },
    body: JSON.stringify({ title: 'Notif Test Coat', brand: 'Test', category: 'Clothing', condition: 'Good', price: 150 }),
  });
}, seed);

// Reload as the watcher and check the badge + dropdown + click-through.
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const badgeText = await page.locator('.navbar-notifications-menu .badge').textContent().catch(() => null);
console.log('Badge count after price drop (expect 1):', badgeText);

await page.locator('button[title="Notifications"]').click();
await page.waitForTimeout(400);
const messageText = await page.locator('.notification-card p').first().textContent();
console.log('Notification message:', messageText);

await page.locator('.notification-card').first().click();
await page.waitForTimeout(600);
console.log('URL after clicking notification (expect /items/<id>):', page.url());

console.log('CONSOLE ERRORS:', JSON.stringify(consoleErrors, null, 2));
await browser.close();
```

Run: `node verify-price-drop-notification.mjs`

Expected output: badge count before is `0` (or the locator finds nothing), badge count after is `1`, the message text contains `"Notif Test Coat" dropped from $200.00 to $150.00.`, the final URL matches `/items/<listingId>`, and `CONSOLE ERRORS` is `[]`.

Delete the script and stop both servers when done.

- [ ] **Step 4: Commit**

```bash
git add chasel-frontend/src/pages/Notifications.tsx
git commit -m "feat(notifications): fetch real notifications instead of mock data"
```

---

## Final check

After Task 4, run the full backend suite once more (`cd chasel && ./mvnw test` — expect 19 passing) and `cd chasel-frontend && npm run build && npm run lint` to confirm nothing regressed across all four tasks together.
