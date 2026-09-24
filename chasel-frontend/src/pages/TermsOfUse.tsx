import StaticPage from '../components/StaticPage';

function TermsOfUse() {
  return (
    <StaticPage
      eyebrow="Policies"
      title="Terms of Use"
      intro="This is placeholder content for development purposes and has not been reviewed by legal counsel — replace it with your own reviewed terms before launch."
      lastUpdated="August 2026"
      sections={[
        {
          heading: 'Acceptance of terms',
          body: [
            'By creating an account or using Chasel, you agree to these Terms of Use. If you don’t agree, please don’t use the platform.',
          ],
        },
        {
          heading: 'Using Chasel',
          body: [
            'You must provide accurate information when creating an account and keep it up to date. You’re responsible for activity on your account.',
            'Listings must accurately describe the item being sold, including its condition, and must use real photos of the actual item.',
          ],
        },
        {
          heading: 'Prohibited conduct',
          body: [
            'You may not list counterfeit, stolen, or prohibited items, misrepresent an item’s condition or authenticity, or use the platform to harass other users.',
            'We may remove listings or suspend accounts that violate these terms or our community guidelines.',
          ],
        },
        {
          heading: 'Payments & fees',
          body: [
            'Any applicable service fees will be clearly shown before you complete a purchase or listing. Chasel is not a party to the underlying sale between buyer and seller.',
          ],
        },
        {
          heading: 'Intellectual property',
          body: [
            'The Chasel name, logo, and site design are owned by Chasel. Listing photos and descriptions remain the property of the seller who posted them.',
          ],
        },
        {
          heading: 'Disclaimers & limitation of liability',
          body: [
            'Chasel is provided "as is." We do our best to keep the marketplace trustworthy, but we don\'t guarantee the accuracy of listings created by users, and we\'re not liable for disputes between buyers and sellers beyond what\'s required by law.',
          ],
        },
        {
          heading: 'Changes to these terms',
          body: [
            'We may update these terms from time to time. Continued use of Chasel after a change means you accept the updated terms.',
          ],
        },
        {
          heading: 'Contact us',
          body: [
            'Questions about these terms? Reach us at legal@chasel.example.',
          ],
        },
      ]}
    />
  );
}

export default TermsOfUse;
