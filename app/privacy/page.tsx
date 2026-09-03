import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f5f2ec] px-5 py-12 text-[#17233a]">
      <article className="mx-auto max-w-3xl rounded-[1.5rem] border border-[#ddd7cc] bg-white p-6 shadow-sm sm:p-10">
        <p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#9a6d19]">
          THERMOWATCH · SIH26083
        </p>
        <h1 className="mt-3 text-3xl font-bold">Privacy and data use</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          ThermoWatch is an early-warning and decision-support prototype. It is
          not a medical service or an official government warning system.
        </p>

        <div className="mt-8 space-y-7 text-sm leading-7 text-slate-600">
          <section>
            <h2 className="text-lg font-semibold text-[#17233a]">
              Information stored
            </h2>
            <p>
              The system stores weather observations, model predictions,
              warning records, alert acknowledgements and community incident
              reports. A reporter name is optional; anonymous reporting is the
              default. Do not enter medical records, government identifiers,
              phone numbers or other unnecessary personal information.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#17233a]">
              Identity and permissions
            </h2>
            <p>
              Public visitors can view operational information. Authority
              actions use the signed-in ChatGPT user identifier supplied by the
              hosting platform. Audit records store the actor identifier and
              role, not passwords or authentication tokens.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#17233a]">
              Purpose and sharing
            </h2>
            <p>
              Data is used to demonstrate heat-risk monitoring, response
              coordination, validation and accountability. ThermoWatch does not
              sell personal information. Weather requests are sent to
              Open-Meteo, and facility searches are sent to OpenStreetMap
              services without incident descriptions or reporter names.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#17233a]">
              Local assistant and voice
            </h2>
            <p>
              Assistant answers are created in the browser from the heat-risk
              data already shown on screen. Chat messages and audio are not
              stored by ThermoWatch. Optional speech recognition and read-aloud
              use browser-provided voice services, whose processing and
              regional-language availability depend on the user&apos;s browser and
              device. Users can always use text without granting microphone
              access.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#17233a]">
              Retention and deletion
            </h2>
            <p>
              Prototype records are retained for the duration of the SIH
              evaluation so the audit trail can be demonstrated. Before any
              field deployment, the responsible authority must approve a
              time-limited retention schedule, deletion process and legal basis
              appropriate to its jurisdiction.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#17233a]">
              Safety boundary
            </h2>
            <p>
              HTSI and ML predictions support decisions but do not diagnose
              illness. Follow official IMD, NDMA, health-department and emergency
              guidance when available.
            </p>
          </section>
        </div>

        <Link
          href="/"
          className="mt-9 inline-flex rounded-xl bg-[#10213f] px-5 py-3 text-sm font-semibold text-white"
        >
          Return to ThermoWatch
        </Link>
      </article>
    </main>
  );
}
