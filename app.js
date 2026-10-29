"use strict";

// Remote jobs board. Tries the live RemoteOK API first; if that request
// fails (CORS, network, or a bad response), it falls back to the bundled
// jobs-snapshot.json — real listings captured from the live feed on
// 2026-10-29. The page always labels which one is showing.
const LIVE_URL = "https://remoteok.com/api";
const SNAPSHOT_URL = "jobs-snapshot.json";

const searchInput = document.getElementById("search");
const modeEl = document.getElementById("mode");
const statusEl = document.getElementById("status");
const errorEl = document.getElementById("error");
const summaryEl = document.getElementById("summary");
const listEl = document.getElementById("list");
const sourceLineEl = document.getElementById("sourceLine");

let jobs = [];

function salaryText(job) {
  if (job.salary_min > 0 || job.salary_max > 0) {
    const low = job.salary_min > 0 ? "$" + job.salary_min.toLocaleString("en-US") : "";
    const high = job.salary_max > 0 ? "$" + job.salary_max.toLocaleString("en-US") : "";
    if (low && high && low !== high) return low + " – " + high + " / year";
    return (high || low) + " / year";
  }
  return "Salary not listed";
}

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const visible = query === "" ? jobs : jobs.filter((job) => {
    const haystack = [job.position, job.company, (job.tags || []).join(" ")]
      .join(" ").toLowerCase();
    return haystack.includes(query);
  });
  listEl.textContent = "";
  summaryEl.textContent = query === ""
    ? visible.length + " jobs shown."
    : visible.length + " of " + jobs.length + " jobs match “" + searchInput.value.trim() + "”.";
  for (const job of visible) {
    const item = document.createElement("li");

    const title = document.createElement("h3");
    const link = document.createElement("a");
    link.href = job.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = job.position;
    title.appendChild(link);
    item.appendChild(title);

    const company = document.createElement("p");
    company.className = "company";
    company.textContent = job.company + " · " +
      (job.location || "Remote (location not listed)");
    item.appendChild(company);

    if (job.tags && job.tags.length > 0) {
      const tags = document.createElement("div");
      tags.className = "tags";
      for (const tag of job.tags.slice(0, 12)) {
        const span = document.createElement("span");
        span.className = "tag";
        span.textContent = tag;
        tags.appendChild(span);
      }
      item.appendChild(tags);
    }

    const meta = document.createElement("p");
    meta.className = "meta";
    meta.textContent = "Posted " + new Date(job.date).toLocaleDateString() +
      " · " + salaryText(job);
    item.appendChild(meta);

    listEl.appendChild(item);
  }
}

function showLive(list) {
  jobs = list;
  modeEl.className = "mode live";
  modeEl.textContent = "● LIVE — fetched from RemoteOK just now";
  errorEl.hidden = true;
  statusEl.textContent = "Live data loaded.";
  sourceLineEl.textContent =
    "Source: RemoteOK public API. Page last updated: " + new Date().toLocaleString() + ".";
  render();
}

async function showSnapshot(reason) {
  try {
    const res = await fetch(SNAPSHOT_URL);
    if (!res.ok) throw new Error("Snapshot returned HTTP " + res.status);
    const snapshot = await res.json();
    jobs = snapshot.jobs || [];
    modeEl.className = "mode snapshot";
    modeEl.textContent = "● SNAPSHOT — dated " + snapshot.snapshot_date +
      ", not live (live feed failed: " + reason + ")";
    errorEl.hidden = false;
    errorEl.textContent = "Live RemoteOK feed is unavailable (" + reason +
      "). Showing the bundled snapshot from " + snapshot.snapshot_date +
      " instead. Listings may have closed since — verify on remoteok.com before applying.";
    statusEl.textContent = "Showing snapshot.";
    sourceLineEl.textContent =
      "Source: snapshot of the RemoteOK feed captured " + snapshot.snapshot_date + ".";
    render();
  } catch (err) {
    jobs = [];
    modeEl.className = "mode snapshot";
    modeEl.textContent = "● UNAVAILABLE";
    errorEl.hidden = false;
    errorEl.textContent = "Live feed failed (" + reason + ") and the snapshot could not be loaded (" +
      err.message + "). No jobs are shown rather than invented ones. If you opened this page directly from a file, serve the folder with a local web server so the snapshot file can load.";
    statusEl.textContent = "No data available.";
    render();
  }
}

async function loadLive() {
  statusEl.textContent = "Loading live data…";
  errorEl.hidden = true;
  try {
    const res = await fetch(LIVE_URL);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Unexpected API response");
    const list = data
      .filter((entry) => entry && entry.position && entry.company)
      .map((entry) => ({
        position: entry.position,
        company: entry.company,
        tags: Array.isArray(entry.tags) ? entry.tags : [],
        location: entry.location || "",
        date: entry.date,
        url: entry.apply_url || entry.url,
        salary_min: entry.salary_min || 0,
        salary_max: entry.salary_max || 0
      }));
    if (list.length === 0) throw new Error("Feed returned no jobs");
    showLive(list);
  } catch (err) {
    await showSnapshot(err.message);
  }
}

searchInput.addEventListener("input", render);
document.getElementById("refresh").addEventListener("click", loadLive);
loadLive();
setInterval(loadLive, 15 * 60 * 1000);
