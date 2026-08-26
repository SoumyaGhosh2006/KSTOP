import { useEffect, useState } from "react";
import MentorShell from "../../../components/mentor/MentorShell";
import api from "../../../utils/api";
import "./mentor-dashboard.css";

export default function MentorMessages() {
  const [messages, setMessages] = useState([]);
  const [studentNames, setStudentNames] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [messagesRes, menteesRes] = await Promise.all([
          api.get("/mentor/messages"),
          api.get("/mentor/mentees"),
        ]);

        const nameMap = {};
        (menteesRes.data.mentees || []).forEach((m) => {
          nameMap[m.id] = `${m.name} (${m.rollNumber})`;
        });

        setStudentNames(nameMap);
        setMessages(messagesRes.data.messages || []);
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <MentorShell title="Messages" backTo="/dashboard/mentor">
        <div className="mentor-surface mentor-panel-card mentor-loading-row">
          <span className="mentor-spinner" />
          Loading messages...
        </div>
      </MentorShell>
    );
  }

  if (messages.length === 0) {
    return (
      <MentorShell title="Messages" backTo="/dashboard/mentor">
        <div className="mentor-surface mentor-empty-state">
          <h3>No messages yet</h3>
          <p>When a parent messages you about their child, it'll appear here.</p>
        </div>
      </MentorShell>
    );
  }

  return (
    <MentorShell title="Messages" backTo="/dashboard/mentor">
      <div className="mentor-card-list">
        {messages.map((m) => (
          <article className="mentor-surface mentor-message-card" key={m.id}>
            <span className="mentor-message-card__from">
              {studentNames[m.studentId] ? `Parent of ${studentNames[m.studentId]}` : "A parent"}
            </span>
            <p className="mentor-message-card__body">{m.message}</p>
            <span className="mentor-message-card__time">
              {new Date(m.createdAt).toLocaleString("en-IN")}
            </span>
          </article>
        ))}
      </div>
      <p className="mentor-info-note">
        This is a read-only view — replying from the mentor portal isn't available yet.
      </p>
    </MentorShell>
  );
}