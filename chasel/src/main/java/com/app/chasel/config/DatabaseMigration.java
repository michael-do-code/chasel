package com.app.chasel.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

/** Small local-data migration for databases created before order notifications existed. */
@Component
public class DatabaseMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        String database = jdbcTemplate.getDataSource() == null
                ? ""
                : jdbcTemplate.execute((ConnectionCallback<String>) connection ->
                        connection.getMetaData().getDatabaseProductName());

        if (database != null && database.equalsIgnoreCase("H2")) {
            // Older Hibernate schemas used H2 ENUM('PRICE_DROP'), which rejects
            // newer order-notification values. VARCHAR remains extensible.
            jdbcTemplate.execute(
                    "ALTER TABLE notifications ALTER COLUMN type SET DATA TYPE VARCHAR(50)");

            List<Map<String, Object>> orders = jdbcTemplate.queryForList(
                    "SELECT id, public_order_number FROM purchase_orders");
            Set<String> used = new HashSet<>();
            orders.forEach(row -> {
                Object current = row.get("PUBLIC_ORDER_NUMBER");
                if (current != null) used.add(current.toString());
            });
            for (Map<String, Object> row : orders) {
                if (row.get("PUBLIC_ORDER_NUMBER") != null) continue;
                String number;
                do {
                    number = String.valueOf(ThreadLocalRandom.current().nextInt(10_000_000, 100_000_000));
                } while (!used.add(number));
                jdbcTemplate.update(
                        "UPDATE purchase_orders SET public_order_number = ? WHERE id = ?",
                        number, row.get("ID"));
            }
        }
    }
}
