import StaticPage from '../components/StaticPage';

function PrivacyPolicy() {
  return (
    <StaticPage
      eyebrow="Policies"
      title="Privacy Policy"
      intro="This is placeholder content for development purposes and has not been reviewed by legal counsel — replace it with your own reviewed policy before launch."
      lastUpdated="August 2026"
      sections={[
        {
          heading: 'Information we collect',
          body: [
            'When you create an account, we collect your name, email address, and any profile details you choose to add, such as a phone number or location.',
            'When you list or purchase an item, we collect the information needed to complete that transaction, including listing details, messages between buyers and sellers, and shipping information.',
          ],
        },
        {
          heading: 'How we use your information',
          body: [
            'We use your information to operate the marketplace: creating your account, showing your listings to other users, facilitating messages and transactions, and keeping the platform secure.',
            'We may also use it to improve Chasel — understanding which features are useful, and communicating updates that affect your account.',
          ],
        },
        {
          heading: 'Sharing your information',
          body: [
            'We share the minimum information necessary between a buyer and seller to complete a transaction, such as a shipping address once a sale is confirmed.',
            'We do not sell your personal information to third parties.',
          ],
        },
        {
          heading: 'Cookies & tracking',
          body: [
            'Chasel uses essential cookies to keep you signed in and remember your preferences. We do not currently use third-party advertising trackers.',
          ],
        },
        {
          heading: 'Data retention & security',
          body: [
            'We retain account and transaction information for as long as your account is active, or as needed to comply with legal obligations. We use industry-standard measures to protect your data, but no system is perfectly secure.',
          ],
        },
        {
          heading: 'Your rights & choices',
          body: [
            'You can review and update your account information at any time from your profile. To request deletion of your account and associated data, contact us using the details below.',
          ],
        },
        {
          heading: 'Contact us',
          body: [
            'Questions about this policy? Reach us at privacy@chasel.example.',
          ],
        },
      ]}
    />
  );
}

export default PrivacyPolicy;
