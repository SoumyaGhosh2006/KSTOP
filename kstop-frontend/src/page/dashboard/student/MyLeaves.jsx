import StudentShell from "../../../components/student/StudentShell";
import "./student-dashboard.css";

const FILTERS = ["All", "Pending", "Approved", "Rejected"];

const LEAVES = [
  { title: "Medical leave | 2 Aug - 3 Aug", hint: "Tap row -> Leave Detail", status: "Approved", tone: "approved" },
  { title: "Home visit | 14 Aug - 18 Aug", hint: "Tap row -> Leave Detail", status: "Awaiting mentor", tone: "pending" },
  { title: "Vacation | 20 Jul - 25 Jul", hint: "Tap row -> Leave Detail", status: "Approved", tone: "approved" },
  { title: "Family event | 10 Jul - 11 Jul", hint: "Tap row -> Leave Detail", status: "Rejected", tone: "rejected", highlighted: true },
];

export default function MyLeaves() {
  return (
    <StudentShell title="My Leaves" backTo="/dashboard/student">
      <div className="student-filter-row">
        {FILTERS.map((filter, index) => (
          <button key={filter} type="button" className={`student-filter-pill${index === 0 ? " is-active" : ""}`}>
            {filter}
          </button>
        ))}
      </div>

      <section className="student-leave-list">
        {LEAVES.map((leave) => (
          <article key={leave.title} className={`student-row-card${leave.highlighted ? " is-highlighted" : ""}`}>
            <div>
              <h3>{leave.title}</h3>
              <p>{leave.hint}</p>
            </div>
            <span className={`student-status-pill is-${leave.tone}`}>{leave.status}</span>
          </article>
        ))}
      </section>
    </StudentShell>
  );
}
