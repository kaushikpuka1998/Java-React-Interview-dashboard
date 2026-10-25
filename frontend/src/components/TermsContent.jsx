// Terms of use and privacy notice shown at sign-up. Items in [brackets] must be confirmed before launch.
const SECTIONS = [
  {
    title: 'What we collect',
    items: [
      'Account details you enter: email, name, optional username, password (stored only as a salted hash).',
      'Your location: the country and city you choose, and an approximate location from your IP address when you sign up or log in.',
      'Your activity: questions you read, mark as read, flag or mark important, and your personal notes.',
      'Resume content you write in the resume builder, including the PDFs and LaTeX you generate.',
      'Usage data: pages viewed, clicks, device type, referring site, and campaign tags (UTM), linked to your account while you are signed in.',
    ],
  },
  {
    title: 'Why we use it',
    items: [
      'To run the service: save your progress, keep your resumes, and show your profile.',
      'To show the leaderboard: your username and XP appear there. Your profile is public only if you share your username link.',
      'To send emails you have opted into, such as new-question digests and announcements. Every email has an unsubscribe link.',
      'To improve the product: usage is analysed in aggregate to understand which features are used.',
    ],
  },
  {
    title: 'Who sees it',
    items: [
      'You, and the site administrators for support and moderation.',
      'Service providers that host the app, send email, and store data, only as needed to run the service.',
      'We do not sell your personal data and we do not use it for third-party advertising.',
    ],
  },
  {
    title: 'How long we keep it',
    items: [
      'Your account and content are kept while your account is active.',
      'Usage logs are kept for [12] months, then deleted or aggregated.',
    ],
  },
  {
    title: 'Your choices',
    items: [
      'Access, correct or download your data from your profile.',
      'Delete your account, which removes your personal data and resumes. [Confirm the deletion process and timing.]',
      'Opt out of emails at any time using the unsubscribe link in an email.',
      'Questions or requests: [contact email].',
    ],
  },
]

export default function TermsContent() {
  return (
    <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
      <p>By creating an account you agree to these terms and to how we handle your data as described below.</p>
      {SECTIONS.map(sec => (
        <section key={sec.title}>
          <h3 className="mb-1 font-semibold text-slate-900 dark:text-slate-100">{sec.title}</h3>
          <ul className="list-disc space-y-1 pl-5">
            {sec.items.map(item => <li key={item}>{item}</li>)}
          </ul>
        </section>
      ))}
    </div>
  )
}
