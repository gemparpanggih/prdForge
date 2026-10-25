export type Language = "en" | "id";
export type Theme = "dark" | "light";

export const LANGUAGE_COOKIE = "prd_language";
export const THEME_COOKIE = "prd_theme";

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "id", label: "Bahasa Indonesia" },
];

export const THEMES: { value: Theme; label: string }[] = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
];

export function parseLanguage(value: string | undefined): Language {
  return value === "id" ? "id" : "en";
}

export function parseTheme(value: string | undefined): Theme {
  return value === "light" ? "light" : "dark";
}

const id: Record<string, string> = {
  // Shell
  Projects: "Proyek",
  Settings: "Pengaturan",
  "New project": "Proyek baru",
  "Local workspace": "Workspace lokal",
  "Blueprint studio": "Studio blueprint",
  "No account, no cloud sync. Projects and encrypted AI keys stay on this machine.":
    "Tanpa akun, tanpa sinkronisasi cloud. Proyek dan API key AI terenkripsi tetap di mesin ini.",
  "Embedded Postgres": "Postgres tertanam",
  Manage: "Kelola",
  Theme: "Tema",
  Language: "Bahasa",
  Dark: "Gelap",
  Light: "Terang",
  English: "English",
  "Bahasa Indonesia": "Bahasa Indonesia",
  "Open navigation": "Buka navigasi",
  "Close navigation": "Tutup navigasi",
  "Back to projects": "Kembali ke proyek",
  "Toggle theme": "Ganti tema",

  // Common
  Close: "Tutup",
  Cancel: "Batal",
  Delete: "Hapus",
  Save: "Simpan",
  "Save changes": "Simpan perubahan",
  Saving: "Menyimpan",
  Saved: "Tersimpan",
  "All changes saved": "Semua perubahan tersimpan",
  "Unsaved changes": "Perubahan belum disimpan",
  "Save failed": "Gagal menyimpan",
  "Try again": "Coba lagi",
  "Something broke.": "Terjadi kesalahan.",
  "Unexpected server error.": "Terjadi kesalahan server.",
  "This page is not in the blueprint.": "Halaman ini tidak ada di blueprint.",
  "The project may have been deleted, or the link points to a page that does not exist.":
    "Proyek mungkin sudah dihapus, atau tautannya mengarah ke halaman yang tidak ada.",
  requirement: "requirement",
  requirements: "requirement",
  task: "task",
  tasks: "task",
  "requirement(s)": "requirement",
  "task(s)": "task",
  files: "file",
  total: "total",

  // Status / priority
  interview: "wawancara",
  assumption: "asumsi",
  user: "user",
  "flow links": "link flow",
  draft: "draf",
  approved: "disetujui",
  review: "review",
  "in review": "dalam review",
  "in-review": "dalam review",
  ready: "siap",
  exported: "diekspor",
  generating: "membuat",
  todo: "belum",
  feature: "fitur",
  infra: "infra",
  test: "test",
  docs: "dokumentasi",
  migration: "migrasi",
  design: "desain",
  in_progress: "dikerjakan",
  "in progress": "dikerjakan",
  blocked: "terblokir",
  done: "selesai",
  must: "wajib",
  should: "sebaiknya",
  could: "bisa",
  wont: "tidak",
  blocker: "blocker",
  major: "major",
  minor: "minor",
  low: "rendah",
  medium: "sedang",
  high: "tinggi",

  // Dashboard
  "Local-first · AI-ready · English output": "Local-first · siap AI · output Inggris",
  "Design the product before you build it.": "Rancang produknya sebelum membangunnya.",
  "Turn a rough idea into a professional PRD, an editable product flow, low-fidelity wireframes, and a dependency-ordered task plan that an AI coding agent can execute.":
    "Ubah ide kasar menjadi PRD profesional, product flow yang bisa diedit, wireframe low-fidelity, dan rencana task berurutan dependency yang bisa dieksekusi AI coding agent.",
  Ready: "Siap",
  "In progress": "Sedang berjalan",
  "Average readiness": "Rata-rata readiness",
  "Total blueprints": "Total blueprint",
  "Readiness ≥ 80": "Readiness ≥ 80",
  "Discovery or draft": "Discovery atau draf",
  "Across all projects": "Semua proyek",
  "Your projects": "Proyek Anda",
  "Start with a short brief. The interview handles the rest.":
    "Mulai dengan brief singkat. Wawancara akan menangani sisanya.",
  "Pick up where you left off.": "Lanjutkan dari tempat Anda berhenti.",
  "No blueprints yet": "Belum ada blueprint",
  "Create your first project. You will answer a few focused discovery questions, then PRD Forge builds the document, flow, wireframes, and task plan.":
    "Buat proyek pertama Anda. Anda akan menjawab beberapa pertanyaan discovery yang fokus, lalu PRD Forge membangun dokumen, flow, wireframe, dan rencana task.",
  "Create your first project": "Buat proyek pertama",
  "How it works": "Cara kerjanya",
  "Four stages, one source of truth, zero hand-waving.":
    "Empat tahap, satu sumber kebenaran, tanpa asumsi tersembunyi.",
  "Discovery interview": "Wawancara discovery",
  "The AI asks only the questions that matter, tracks coverage, and records assumptions explicitly.":
    "AI hanya menanyakan hal penting, melacak coverage, dan mencatat asumsi secara eksplisit.",
  "Blueprint workspace": "Workspace blueprint",
  "Edit the PRD, drag the product flow, and tune low-fidelity wireframes linked to requirements.":
    "Edit PRD, atur product flow, dan sesuaikan wireframe low-fidelity yang terhubung ke requirement.",
  "Execution bundle": "Bundle eksekusi",
  "Export PRD.md, TASKS.md, AGENTS.md, diagrams, and JSON that a coding agent can follow.":
    "Ekspor PRD.md, TASKS.md, AGENTS.md, diagram, dan JSON yang bisa diikuti coding agent.",
  "Bring your own model": "Gunakan model pilihan Anda",
  "The deterministic local engine can generate a complete, valid blueprint without a key. Add a provider in Settings when you want tailored synthesis.":
    "Local engine deterministik bisa membuat blueprint lengkap tanpa API key. Tambahkan provider di Pengaturan jika ingin sintesis yang lebih spesifik.",
  "Configure provider": "Konfigurasi provider",
  Readiness: "Readiness",
  Updated: "Diperbarui",
  "Continue interview": "Lanjutkan wawancara",
  "Open blueprint": "Buka blueprint",
  "Delete project": "Hapus proyek",
  "Delete \"{name}\" and all of its versions? This cannot be undone.":
    "Hapus \"{name}\" dan semua versinya? Tindakan ini tidak bisa dibatalkan.",
  "Project deleted.": "Proyek dihapus.",
  "Could not delete the project.": "Gagal menghapus proyek.",

  // New project
  "New blueprint": "Blueprint baru",
  "What are you building?": "Apa yang ingin Anda bangun?",
  "Start with the smallest useful brief. The discovery interview will fill in users, scope, data, constraints, and non-functional requirements.":
    "Mulai dengan brief terkecil yang berguna. Wawancara discovery akan melengkapi pengguna, scope, data, constraint, dan non-functional requirement.",
  "Project name": "Nama proyek",
  "Product type": "Jenis produk",
  "Short brief": "Brief singkat",
  "Who is it for, what problem does it solve, and what must the first release do?":
    "Untuk siapa, masalah apa yang diselesaikan, dan apa yang harus dilakukan rilis pertama?",
  "A paragraph is enough. Be specific about the user and the pain.":
    "Satu paragraf cukup. Jelaskan user dan pain point secara spesifik.",
  "Or start from an example": "Atau mulai dari contoh",
  "Start discovery interview": "Mulai wawancara discovery",
  "Creating project…": "Membuat proyek…",
  "What happens next": "Apa yang terjadi selanjutnya",
  "Focused interview": "Wawancara terfokus",
  "3–6 rounds of specific questions. Skip anything you do not know; assumptions are recorded.":
    "3–6 ronde pertanyaan spesifik. Lewati yang belum diketahui; asumsi akan dicatat.",
  "Structured blueprint": "Blueprint terstruktur",
  "PRD, requirements with acceptance criteria, technical baseline, flow, and wireframes.":
    "PRD, requirement dengan acceptance criteria, baseline teknis, flow, dan wireframe.",
  "Execution plan": "Rencana eksekusi",
  "Dependency-ordered tasks with test plans, Definition of Done, and agent prompts.":
    "Task berurutan dependency dengan test plan, Definition of Done, dan agent prompt.",
  Export: "Ekspor",
  "A Markdown bundle and machine-readable JSON, validated before download.":
    "Bundle Markdown dan JSON machine-readable, divalidasi sebelum diunduh.",
  "No AI key required to start": "Tidak perlu API key untuk mulai",
  "The local engine produces a complete blueprint. Add a provider later for tailored synthesis and richer domain language.":
    "Local engine menghasilkan blueprint lengkap. Tambahkan provider nanti untuk sintesis yang lebih spesifik dan bahasa domain yang lebih kaya.",
  "Tip:": "Tips:",
  "name the primary user and the decision they need to make. “Sales reps need to know which deals are stalled” produces a sharper plan than “build a CRM”.":
    "sebutkan user utama dan keputusan yang perlu mereka ambil. “Sales rep perlu tahu deal mana yang macet” menghasilkan rencana lebih tajam daripada “buat CRM”.",
  "Give the project a name with at least 2 characters.":
    "Beri nama proyek minimal 2 karakter.",
  "Add a short brief so the interview has context.":
    "Tambahkan brief singkat agar wawancara punya konteks.",
  "Project created. Starting discovery.": "Proyek dibuat. Memulai discovery.",
  "Could not create the project.": "Gagal membuat proyek.",

  // Project header
  Interview: "Wawancara",
  PRD: "PRD",
  "Flow & wireframes": "Flow & wireframe",
  Tasks: "Task",
  Review: "Review",

  // Interview
  "Answer the highest-leverage questions first. Anything you skip becomes an explicit assumption in the blueprint, never a hidden guess.":
    "Jawab pertanyaan paling berdampak terlebih dahulu. Yang dilewati akan menjadi asumsi eksplisit di blueprint, bukan tebakan tersembunyi.",
  "AI interview": "Wawancara AI",
  "Local question bank": "Bank pertanyaan lokal",
  Round: "Ronde",
  "dimensions": "dimensi",
  "View discovery log": "Lihat log discovery",
  "Hide discovery log": "Sembunyikan log discovery",
  "Discovery coverage": "Cakupan discovery",
  Features: "Fitur",
  Security: "Keamanan",
  Metrics: "Metrik",
  "Material dimensions for a build-ready PRD":
    "Dimensi penting untuk PRD yang siap dibangun",
  "Generate the blueprint": "Buat blueprint",
  "Generate now, or continue the interview for sharper requirements.":
    "Buat sekarang, atau lanjutkan wawancara untuk requirement yang lebih tajam.",
  "Answer at least one round to unlock generation. Gaps become explicit assumptions.":
    "Jawab minimal satu ronde untuk membuka generation. Gap akan menjadi asumsi eksplisit.",
  "Generate blueprint": "Buat blueprint",
  "{count} of 12 dimensions covered": "{count} dari 12 dimensi tercakup",
  "Local engine active.": "Local engine aktif.",
  "Questions come from the built-in domain bank. Add a provider in Settings for a tailored interview and synthesis.":
    "Pertanyaan berasal dari bank domain bawaan. Tambahkan provider di Pengaturan untuk wawancara dan sintesis yang lebih spesifik.",
  "Use AI assumption": "Gunakan asumsi AI",
  "Using assumption": "Memakai asumsi",
  "Assume all": "Asumsikan semua",
  "Save answers & continue": "Simpan jawaban & lanjut",
  "The blueprint will record this as an assumption.":
    "Blueprint akan mencatat ini sebagai asumsi.",
  "Be specific. Name the user, the constraint, or the number.":
    "Bersikap spesifik. Sebutkan user, constraint, atau angkanya.",
  "{count} questions in this round. Unanswered items need an explicit assumption.":
    "{count} pertanyaan di ronde ini. Item yang belum dijawab memerlukan asumsi eksplisit.",
  "Discovery complete": "Discovery selesai",
  "You have answered the available question set. Generate the blueprint to synthesize requirements, technical detail, flow, wireframes, and the task plan.":
    "Anda sudah menjawab semua pertanyaan yang tersedia. Buat blueprint untuk menyusun requirement, detail teknis, flow, wireframe, dan rencana task.",
  "Discovery log": "Log discovery",
  "{count} messages before this round": "{count} pesan sebelum ronde ini",
  "No previous rounds yet.": "Belum ada ronde sebelumnya.",
  "Round {round} — {count} discovery questions": "Ronde {round} — {count} pertanyaan discovery",
  "Discovery complete. You can generate the blueprint whenever you are ready.":
    "Discovery selesai. Anda bisa membuat blueprint kapan saja.",
  "Generate the blueprint?": "Buat blueprint?",
  "This creates a new PRD version, product flow, wireframes, and task plan.":
    "Ini membuat versi PRD baru, product flow, wireframe, dan rencana task.",
  "Keep interviewing": "Lanjut wawancara",
  "Generate": "Buat",
  Coverage: "Coverage",
  "dimensions answered": "dimensi terjawab",
  "will become assumptions": "akan menjadi asumsi",
  "Missing details are recorded in the scope assumptions and open questions. You can edit every section after generation.":
    "Detail yang hilang dicatat di asumsi scope dan open question. Setiap bagian bisa diedit setelah generation.",
  "Blueprint ready": "Blueprint siap",
  "The PRD, flow, wireframes, and task plan were generated and saved as a new version.":
    "PRD, flow, wireframe, dan rencana task sudah dibuat dan disimpan sebagai versi baru.",
  "Open PRD": "Buka PRD",
  "flow nodes": "node flow",
  "readiness": "readiness",
  "AI synthesis": "Sintesis AI",
  "Local engine": "Local engine",
  "Generation notes": "Catatan generation",
  "Building your blueprint": "Membangun blueprint Anda",
  "This can take a moment with a remote model.":
    "Proses ini bisa memakan waktu dengan model remote.",
  "Synthesizing product requirements": "Menyusun requirement produk",
  "Building the technical baseline": "Membangun baseline teknis",
  "Designing the product flow": "Merancang product flow",
  "Drafting low-fidelity wireframes": "Membuat wireframe low-fidelity",
  "Planning implementation tasks": "Merencanakan task implementasi",
  "Running the readiness review": "Menjalankan readiness review",
  "Answer or use an assumption.": "Jawab atau gunakan asumsi.",
  "questions are unanswered": "pertanyaan belum dijawab",
  "question is unanswered": "pertanyaan belum dijawab",
  "Round saved.": "Ronde disimpan.",
  "new questions.": "pertanyaan baru.",
  "Could not save your answers.": "Gagal menyimpan jawaban.",
  "Blueprint generation failed.": "Generation blueprint gagal.",

  // Flow
  "Product flow": "Product flow",
  Wireframes: "Wireframe",
  "Task flow": "Task flow",
  "Add node": "Tambah node",
  "Auto layout": "Auto layout",
  "Apply to PRD": "Terapkan ke PRD",
  "Flow saved": "Flow tersimpan",
  "Added {kind} node.": "Node {kind} ditambahkan.",
  "Canvas re-laid out.": "Canvas ditata ulang.",
  "Flow saved.": "Flow tersimpan.",
  "Could not save the flow.": "Gagal menyimpan flow.",
  "Flow applied to PRD v{version}.": "Flow diterapkan ke PRD v{version}.",
  "Could not apply the flow.": "Gagal menerapkan flow.",
  "Product flow canvas": "Canvas product flow",
  "Node inspector": "Inspector node",
  "Edge inspector": "Inspector edge",
  Connection: "Koneksi",
  Type: "Tipe",
  Label: "Label",
  Description: "Deskripsi",
  "Linked requirements": "Requirement terhubung",
  "Unlinked nodes are flagged in the readiness review.":
    "Node tanpa link akan ditandai di readiness review.",
  "Remove missing requirement link": "Hapus link requirement yang hilang",
  Wireframe: "Wireframe",
  "Add wireframe": "Tambah wireframe",
  "Screen title": "Judul screen",
  "What is this screen for?": "Untuk apa screen ini?",
  "Block title": "Judul block",
  "One item per line": "Satu item per baris",
  "Delete node": "Hapus node",
  "Delete edge": "Hapus edge",
  "Trigger or condition": "Trigger atau kondisi",
  "Path type": "Jenis path",
  Default: "Default",
  Success: "Sukses",
  "Failure / alternative": "Gagal / alternatif",
  "Failure paths are rendered as dashed red edges. Success paths use the accent color.":
    "Path gagal ditampilkan sebagai edge merah putus-putus. Path sukses memakai warna accent.",
  "Screen": "Screen",
  "Action": "Aksi",
  "Decision": "Keputusan",
  "System": "Sistem",
  "Data": "Data",
  "Integration": "Integrasi",
  "Actor": "Aktor",
  "New screen": "Screen baru",
  "New action": "Aksi baru",
  "New decision": "Keputusan baru",
  "New actor": "Aktor baru",
  "New system": "Sistem baru",
  "New data store": "Data store baru",
  "New integration": "Integrasi baru",
  "Select a node": "Pilih node",
  "Edit labels, link requirements, and design the wireframe for any screen node.":
    "Edit label, hubungkan requirement, dan desain wireframe untuk screen node.",
  "Add screen": "Tambah screen",
  "No wireframes yet": "Belum ada wireframe",
  "Add a screen node to the product flow, then design its layout in the inspector.":
    "Tambahkan screen node ke product flow, lalu desain layout-nya di inspector.",
  "No screen description": "Belum ada deskripsi screen",
  "Execution graph · dependency order · critical path highlighted":
    "Graph eksekusi · urutan dependency · critical path ditandai",
  "Critical path": "Critical path",
  "Open task list": "Buka daftar task",
  "blockers": "blocker",
  "major issues": "isilah major",
  "Fit view": "Fit view",
  "This flow has unsaved changes.": "Flow memiliki perubahan yang belum disimpan.",

  // Tasks
  "executable tasks": "task siap dieksekusi",
  "Dependency-ordered work with acceptance criteria, test plans, Definition of Done, and self-contained prompts for a coding agent.":
    "Pekerjaan berurutan dependency dengan acceptance criteria, test plan, Definition of Done, dan prompt mandiri untuk coding agent.",
  "Copy all prompts": "Salin semua prompt",
  "Must-have": "Wajib",
  "Release critical": "Kritis untuk rilis",
  "Export gate open": "Gate ekspor terbuka",
  "Review required": "Perlu review",
  Table: "Tabel",
  Board: "Board",
  Graph: "Graph",
  "Search tasks…": "Cari task…",
  "All statuses": "Semua status",
  "All milestones": "Semua milestone",
  "All priorities": "Semua prioritas",
  Task: "Task",
  Priority: "Prioritas",
  Milestone: "Milestone",
  "Depends on": "Bergantung pada",
  Status: "Status",
  "Est.": "Est.",
  "No tasks match the filters.": "Tidak ada task yang cocok dengan filter.",
  "Drop a task here": "Letakkan task di sini",
  "Dependencies run left to right. The critical path is highlighted.":
    "Dependency berjalan dari kiri ke kanan. Critical path ditandai.",
  "No tasks yet": "Belum ada task",
  "Generate the blueprint from the discovery interview to create an execution plan.":
    "Buat blueprint dari wawancara discovery untuk membuat rencana eksekusi.",
  Context: "Konteks",
  "Implementation steps": "Langkah implementasi",
  "Definition of Done": "Definition of Done",
  "Acceptance criteria": "Acceptance criteria",
  "Test plan": "Test plan",
  Requirements: "Requirement",
  Dependencies: "Dependency",
  "Agent prompt": "Agent prompt",
  Copy: "Salin",
  "Foundation work": "Pekerjaan foundation",
  "No dependencies": "Tidak ada dependency",
  "Copy prompt": "Salin prompt",
  "All agent prompts": "Semua agent prompt",
  "Agent prompt copied.": "Agent prompt disalin.",
  "All agent prompts copied.": "Semua agent prompt disalin.",
  "Clipboard permission was denied.": "Izin clipboard ditolak.",
  "Could not update the task.": "Gagal memperbarui task.",

  // Review
  "Readiness review": "Readiness review",
  "Is it ready to build?": "Sudah siap dibangun?",
  "The review checks completeness, observable acceptance criteria, traceability, flow coverage, dependency integrity, and unresolved decisions.":
    "Review memeriksa kelengkapan, acceptance criteria yang teramati, traceability, coverage flow, integritas dependency, dan keputusan yang belum selesai.",
  "Re-run review": "Jalankan ulang review",
  "Review refreshed.": "Review diperbarui.",
  "Readiness score": "Skor readiness",
  "The export gate is open.": "Gate ekspor terbuka.",
  "Resolve blockers before export.": "Selesaikan blocker sebelum ekspor.",
  "Gate passed": "Gate lulus",
  "Gate blocked": "Gate terblokir",
  Findings: "Temuan",
  Blockers: "Blocker",
  Major: "Major",
  Minor: "Minor",
  Traceability: "Traceability",
  "Requirements covered": "Requirement tercakup",
  "Flow nodes": "Node flow",
  "Open blockers": "Blocker terbuka",
  "Quality gates": "Quality gate",
  passed: "lulus",
  "Issues to resolve": "Issue yang perlu diselesaikan",
  "No issues detected. The blueprint is internally consistent.":
    "Tidak ada issue terdeteksi. Blueprint konsisten secara internal.",
  "Traceability matrix": "Matriks traceability",
  "Requirement → tasks → flow": "Requirement → task → flow",
  Requirement: "Requirement",
  Source: "Sumber",
  "Ready to export": "Siap diekspor",
  "The bundle will include PRD.md, TASKS.md, AGENTS.md, diagrams, and machine-readable JSON.":
    "Bundle akan berisi PRD.md, TASKS.md, AGENTS.md, diagram, dan JSON machine-readable.",
  "Open export center": "Buka export center",
  "Nothing to review yet": "Belum ada yang bisa direview",
  "Generate the blueprint to run completeness, testability, traceability, and dependency checks.":
    "Buat blueprint untuk menjalankan pemeriksaan completeness, testability, traceability, dan dependency.",
  "Go to discovery": "Ke discovery",
  "Fix": "Perbaiki",
  "No issues detected.": "Tidak ada issue terdeteksi.",
  "Score": "Skor",

  // Export
  "Execution bundle · PRD v{version}": "Bundle eksekusi · PRD v{version}",
  "Export center": "Export center",
  "A validated Markdown bundle plus machine-readable JSON. The coding agent reads AGENTS.md, then follows TASKS.md in dependency order.":
    "Bundle Markdown tervalidasi plus JSON machine-readable. Coding agent membaca AGENTS.md, lalu mengikuti TASKS.md sesuai urutan dependency.",
  "Copy AI prompt": "Salin prompt AI",
  "Download bundle": "Unduh bundle",
  "Bundle contents": "Isi bundle",
  "generated from the latest PRD version": "dibuat dari versi PRD terbaru",
  "Export history": "Riwayat ekspor",
  "Every download is recorded locally.": "Setiap unduhan dicatat secara lokal.",
  None: "Tidak ada",
  "View all": "Lihat semua",
  "No exports yet.": "Belum ada ekspor.",
  "Export gate": "Gate ekspor",
  "All checks passed.": "Semua pemeriksaan lulus.",
  "Review issues remain.": "Masih ada issue review.",
  "Export is blocked by {blockers} blocker(s), {major} major issue(s), and a score of {score}. You can override and include OPEN_ISSUES.md.":
    "Ekspor diblokir oleh {blockers} blocker, {major} issue major, dan skor {score}. Anda bisa override dan menyertakan OPEN_ISSUES.md.",
  "Download ZIP": "Unduh ZIP",
  "What the agent gets": "Yang diterima agent",
  "A single ordered task plan with dependencies":
    "Rencana task tunggal yang berurutan dengan dependency",
  "Acceptance criteria and Definition of Done":
    "Acceptance criteria dan Definition of Done",
  "Architecture, data model, and API contracts":
    "Arsitektur, data model, dan kontrak API",
  "Mermaid diagrams for flow and task graph":
    "Diagram Mermaid untuk flow dan task graph",
  "Execution rules and scope guardrails":
    "Aturan eksekusi dan guardrail scope",
  "Machine-readable": "Machine-readable",
  "Use TASKS.json or prd.json to sync the plan into your own tooling without parsing Markdown.":
    "Gunakan TASKS.json atau prd.json untuk sinkronisasi ke tooling Anda tanpa parsing Markdown.",
  "Export with open issues?": "Ekspor dengan issue terbuka?",
  "The bundle will include OPEN_ISSUES.md so the implementation agent can see the unresolved findings.":
    "Bundle akan menyertakan OPEN_ISSUES.md agar agent implementasi bisa melihat temuan yang belum selesai.",
  "Download with issues": "Unduh dengan issue",
  "PRD preview": "Preview PRD",
  "Rendered from the structured content and current product flow.":
    "Dirender dari konten terstruktur dan product flow saat ini.",
  "File preview": "Preview file",
  "Preview of the generated export file.": "Preview file ekspor yang dihasilkan.",
  "File copied.": "File disalin.",
  "Export failed.": "Ekspor gagal.",
  "Nothing to export yet": "Belum ada yang bisa diekspor",
  "Generate the blueprint first. Export becomes available after the PRD, flow, and tasks exist.":
    "Buat blueprint terlebih dahulu. Ekspor tersedia setelah PRD, flow, dan task ada.",
  "Export bundle downloaded.": "Bundle ekspor diunduh.",
  "AI execution prompt copied.": "Prompt eksekusi AI disalin.",

  // Settings
  "Local-only workspace": "Workspace lokal saja",
  "Bring your own model provider. Keys are encrypted at rest and never returned to the browser. Without a provider, PRD Forge uses its deterministic local engine.":
    "Gunakan provider model pilihan Anda. Key dienkripsi saat disimpan dan tidak pernah dikembalikan ke browser. Tanpa provider, PRD Forge memakai local engine deterministik.",
  "API key required": "API key diperlukan",
  "No API key required": "Tidak perlu API key",
  "Not configured": "Belum dikonfigurasi",
  "Configured": "Terkonfigurasi",
  "Key saved": "Key tersimpan",
  "API key": "API key",
  "Encrypted with AES-256-GCM. The raw value is never sent back to the browser.":
    "Dienkripsi dengan AES-256-GCM. Nilai asli tidak pernah dikirim kembali ke browser.",
  "Use the exact model identifier accepted by the provider.":
    "Gunakan identifier model yang diterima provider.",
  "Base URL": "Base URL",
  "Point this at your local Ollama OpenAI-compatible endpoint.":
    "Arahkan ke endpoint OpenAI-compatible Ollama lokal Anda.",
  "Must implement the provider's chat/messages API. Used only from the local server.":
    "Harus mengimplementasikan chat/messages API provider. Hanya dipakai dari server lokal.",
  "Last successful test {time}.": "Tes terakhir berhasil {time}.",
  "Save provider": "Simpan provider",
  "Test connection": "Tes koneksi",
  Remove: "Hapus",
  "Save changes before testing.": "Simpan perubahan sebelum tes.",
  "Generation defaults": "Default generation",
  "Default provider": "Provider default",
  "Default model": "Model default",
  "Estimated budget (USD)": "Estimasi budget (USD)",
  "AI calls pause when estimated spend reaches this cap; 0 disables the guard. Provider invoices remain the source of truth.":
    "Panggilan AI berhenti saat estimasi biaya mencapai batas ini; 0 menonaktifkan guard. Tagihan provider tetap menjadi acuan.",
  "Save defaults": "Simpan default",
  "Local data and security": "Data lokal dan keamanan",
  Database: "Database",
  "Encryption key": "Kunci enkripsi",
  "Embedded PostgreSQL (PGlite). No external database service required.":
    "PostgreSQL tertanam (PGlite). Tidak perlu service database eksternal.",
  "Generated locally with mode 0600. Back it up with the database or keys become unreadable.":
    "Dibuat lokal dengan mode 0600. Backup bersama database atau key tidak bisa dibaca.",
  "There is no account system and no outbound telemetry. The server binds to localhost by default. AI requests go only to the provider you configure.":
    "Tidak ada sistem akun dan tidak ada telemetri keluar. Server bind ke localhost secara default. Request AI hanya ke provider yang Anda konfigurasi.",
  "Local engine mode": "Mode local engine",
  "{count} provider(s) configured": "{count} provider terkonfigurasi",
  "AI synthesis is enabled. Failed AI stages fall back to the local engine and record a warning.":
    "Sintesis AI aktif. Tahap AI yang gagal akan fallback ke local engine dan mencatat warning.",
  "Add an API key to enable tailored interview questions and AI synthesis.":
    "Tambahkan API key untuk mengaktifkan pertanyaan wawancara dan sintesis AI yang lebih spesifik.",
  "No account system": "Tanpa sistem akun",
  "No outbound telemetry": "Tanpa telemetri keluar",
  "Local-only": "Lokal saja",
  "Configured provider": "Provider terkonfigurasi",
  "Remove the {name} configuration?": "Hapus konfigurasi {name}?",
  "Provider configuration removed.": "Konfigurasi provider dihapus.",
  "Generation settings saved.": "Pengaturan generation disimpan.",
  "Could not save settings.": "Gagal menyimpan pengaturan.",
  "Could not save the provider.": "Gagal menyimpan provider.",
  "Connection test failed.": "Tes koneksi gagal.",
  "Could not remove the provider.": "Gagal menghapus provider.",
  "Save the provider configuration before testing it.":
    "Simpan konfigurasi provider sebelum melakukan tes.",
  "Add an API key before testing this provider.":
    "Tambahkan API key sebelum menguji provider ini.",
  "Add a model name before testing this provider.":
    "Tambahkan nama model sebelum menguji provider ini.",

  // Error / 404
  "The local operation failed. Check the server console for details.":
    "Operasi lokal gagal. Periksa console server untuk detail.",
  "A database operation failed. Check the server console for details.":
    "Operasi database gagal. Periksa console server untuk detail.",
  "404": "404",

  // Tech stack selection
  "Tech stack & environment": "Tech stack & environment",
  "Choose how the technical blueprint should be built.":
    "Pilih bagaimana technical blueprint akan dibangun.",
  Auto: "Otomatis",
  Preset: "Preset",
  Custom: "Custom",
  "Let the AI choose the stack. The local engine uses a project-type heuristic.":
    "Biarkan AI memilih stack. Local engine memakai heuristik berdasarkan jenis produk.",
  "Choose a popular stack and environment.": "Pilih stack dan environment yang populer.",
  "Describe your own stack and deployment environment.":
    "Jelaskan stack dan environment deployment Anda sendiri.",
  "Preset stack": "Stack preset",
  Environment: "Lingkungan",
  "Custom stack description": "Deskripsi stack custom",
  "e.g. Laravel 12 + MySQL + Redis, deployed with Docker on a VPS. Must use Inertia + React.":
    "Contoh: Laravel 12 + MySQL + Redis, di-deploy dengan Docker di VPS. Wajib memakai Inertia + React.",
  "The local engine records this as a project constraint. AI mode receives it as a hard requirement.":
    "Local engine mencatat ini sebagai constraint proyek. Mode AI menerimanya sebagai requirement wajib.",
  "The AI decides the stack. The local engine uses a project-type heuristic: web products default to Next.js + PostgreSQL, mobile products to React Native + Supabase.":
    "AI yang menentukan stack. Local engine memakai heuristik jenis produk: produk web default ke Next.js + PostgreSQL, produk mobile ke React Native + Supabase.",
  "Describe the custom stack when the custom option is selected.":
    "Jelaskan stack custom saat opsi custom dipilih.",
  "Custom stack": "Stack custom",
  web: "web",
  backend: "backend",
  mobile: "mobile",
  serverless: "serverless",
  content: "konten",
  "A modern full-stack TypeScript web application with a managed PostgreSQL database.":
    "Aplikasi web full-stack TypeScript modern dengan database PostgreSQL terkelola.",
  "A React single-page application backed by a Node.js/Express API and MongoDB.":
    "Aplikasi React single-page dengan API Node.js/Express dan MongoDB.",
  "A Laravel monolith with a server-rendered or Inertia-powered UI and MySQL.":
    "Monolith Laravel dengan UI server-rendered atau Inertia dan MySQL.",
  "A Django application with server-rendered pages or HTMX and PostgreSQL.":
    "Aplikasi Django dengan halaman server-rendered atau HTMX dan PostgreSQL.",
  "A typed Python API with a React SPA and PostgreSQL.":
    "API Python bertipe dengan React SPA dan PostgreSQL.",
  "A Rails monolith using Hotwire for interactivity and PostgreSQL.":
    "Monolith Rails dengan Hotwire untuk interaktivitas dan PostgreSQL.",
  "A Java/Spring Boot service with a React or server-rendered UI and PostgreSQL.":
    "Service Java/Spring Boot dengan UI React atau server-rendered dan PostgreSQL.",
  "A cross-platform mobile app with Expo and Supabase for auth, data, and storage.":
    "Aplikasi mobile cross-platform dengan Expo dan Supabase untuk auth, data, dan storage.",
  "A cross-platform Flutter app backed by Firebase authentication, Firestore, and cloud functions.":
    "Aplikasi Flutter cross-platform dengan Firebase Authentication, Firestore, dan cloud functions.",
  "A TypeScript serverless application using AWS Lambda, API Gateway, DynamoDB, and Cognito.":
    "Aplikasi serverless TypeScript dengan AWS Lambda, API Gateway, DynamoDB, dan Cognito.",
  "A content-led Astro site with a headless CMS and CDN delivery.":
    "Situs Astro berbasis konten dengan headless CMS dan delivery via CDN.",
  Problem: "Masalah",
  "Goals & metrics": "Tujuan & metrik",
  Journeys: "Journey",
  Scope: "Scope",
  "Non-functional": "Non-functional",
  Technical: "Technical",
  UX: "UX",

  // Additional UI coverage
  "API endpoints": "Endpoint API",
  "Accepted an AI assumption.": "Menerima asumsi AI.",
  Accessibility: "Aksesibilitas",
  Add: "Tambah",
  "Add term": "Tambah istilah",
  "Appearance & language": "Tampilan & bahasa",
  Approved: "Disetujui",
  Assumptions: "Asumsi",
  Auth: "Auth",
  "Autosaves to the current version.": "Menyimpan otomatis ke versi saat ini.",
  Blocked: "Terblokir",
  Blocking: "Memblokir",
  "Blocking release": "Memblokir rilis",
  Choice: "Pilihan",
  Constraints: "Constraint",
  Could: "Bisa",
  "Could not load the file.": "Gagal memuat file.",
  "Could not save the PRD.": "Gagal menyimpan PRD.",
  "Creates an immutable snapshot.": "Membuat snapshot yang tidak bisa diubah.",
  "Current state": "Kondisi saat ini",
  "Data model": "Data model",
  Definition: "Definisi",
  Deployment: "Deployment",
  "Discovery complete. Your blueprint is ready to generate.":
    "Discovery selesai. Blueprint Anda siap dibuat.",
  Document: "Dokumen",
  "Document health": "Kesehatan dokumen",
  Done: "Selesai",
  Draft: "Draf",
  "Edge cases": "Edge case",
  "Entity name": "Nama entity",
  "Every requirement needs observable acceptance criteria. IDs are stable references for tasks and flow nodes.":
    "Setiap requirement harus punya acceptance criteria yang teramati. ID menjadi referensi stabil untuk task dan flow node.",
  "Evidence and context": "Bukti dan konteks",
  "Executive summary": "Ringkasan eksekutif",
  "Exit criteria": "Kriteria keluar",
  "Fields — name | type | required | notes": "Field — nama | tipe | wajib | catatan",
  "Finish at least one discovery round, then generate the blueprint. The PRD, flow, wireframes, and tasks are created together.":
    "Selesaikan minimal satu ronde discovery, lalu buat blueprint. PRD, flow, wireframe, dan task dibuat bersamaan.",
  "Functional requirements": "Functional requirement",
  "Generate the blueprint first. Tasks are derived from the requirements and ordered by dependency.":
    "Buat blueprint terlebih dahulu. Task diturunkan dari requirement dan diurutkan berdasarkan dependency.",
  "Generate the blueprint first. You can then drag nodes, edit wireframes, link requirements, and apply changes back to the PRD.":
    "Buat blueprint terlebih dahulu. Setelah itu Anda bisa mengatur node, mengedit wireframe, menghubungkan requirement, dan menerapkan perubahan kembali ke PRD.",
  Glossary: "Glosarium",
  Goals: "Tujuan",
  "Goals & success metrics": "Tujuan & metrik sukses",
  High: "Tinggi",
  "How the team will prove the product works, and what blocks release.":
    "Bagaimana tim membuktikan produk bekerja, dan apa yang menghalangi rilis.",
  "Identity, status, and the one-paragraph summary a busy reader needs.":
    "Identitas, status, dan ringkasan satu paragraf yang dibutuhkan pembaca sibuk.",
  Impact: "Dampak",
  "In review": "Dalam review",
  "In scope": "Dalam scope",
  Integrations: "Integrasi",
  Interviewer: "Interviewer",
  Journey: "Journey",
  "Journey name": "Nama journey",
  Layer: "Layer",
  Likelihood: "Kemungkinan",
  "Likelihood, impact, mitigation, and an accountable owner.":
    "Kemungkinan, dampak, mitigasi, dan owner yang bertanggung jawab.",
  Low: "Rendah",
  "Make the pain concrete and the evidence inspectable.":
    "Buat pain point konkret dan bukti yang bisa diperiksa.",
  "Measurable target": "Target terukur",
  Medium: "Sedang",
  Metric: "Metrik",
  "Milestones and task assignments. Task IDs are synchronized from the execution plan.":
    "Milestone dan pembagian task. ID task disinkronkan dari rencana eksekusi.",
  Mitigation: "Mitigasi",
  Model: "Model",
  "Model identifier": "Identifier model",
  Must: "Wajib",
  NFR: "NFR",
  NFRs: "NFR",
  Name: "Nama",
  "Needs a decision": "Perlu keputusan",
  "Needs attention": "Perlu perhatian",
  "No PRD yet": "Belum ada PRD",
  "No blockers": "Tidak ada blocker",
  "No execution plan yet": "Belum ada rencana eksekusi",
  "No product flow yet": "Belum ada product flow",
  "Non-blocking": "Tidak memblokir",
  "Non-functional requirement": "Non-functional requirement",
  "Non-functional requirements": "Non-functional requirement",
  "Non-goals": "Non-goal",
  "Not required": "Tidak diperlukan",
  Objective: "Objective",
  Objectives: "Objective",
  "Open questions": "Open question",
  "Out of scope": "Di luar scope",
  Outcome: "Hasil",
  "Outcome statement": "Pernyataan hasil",
  "Outcomes, measurable targets, and the things you deliberately will not optimize.":
    "Hasil, target terukur, dan hal yang sengaja tidak dioptimalkan.",
  Overview: "Ringkasan",
  Owner: "Owner",
  "Pain points": "Pain point",
  Persona: "Persona",
  Personas: "Persona",
  Preview: "Preview",
  Principles: "Prinsip",
  "Principles, required states, accessibility, and the flows a builder must preserve.":
    "Prinsip, state wajib, aksesibilitas, dan flow yang harus dipertahankan oleh builder.",
  "Problem & background": "Masalah & latar belakang",
  "Problem statement": "Pernyataan masalah",
  Purpose: "Tujuan",
  "QA strategy": "Strategi QA",
  Question: "Pertanyaan",
  Questions: "Pertanyaan",
  Rationale: "Alasan",
  "Readiness issues must be resolved or explicitly overridden.":
    "Issue readiness harus diselesaikan atau di-override secara eksplisit.",
  Relationships: "Relasi",
  "Release plan": "Rencana rilis",
  Request: "Request",
  "Required states": "State wajib",
  "Requirement IDs and flow links stay stable across edits. The readiness score updates after each save and again on the Review page.":
    "ID requirement dan link flow tetap stabil antar-edit. Skor readiness diperbarui setelah setiap penyimpanan dan di halaman Review.",
  Resolution: "Resolusi",
  Response: "Response",
  Risk: "Risiko",
  Risks: "Risiko",
  Role: "Peran",
  "Roles with goals and friction. Keep them grounded in the discovery answers.":
    "Peran dengan tujuan dan friksi. Jaga agar tetap sesuai jawaban discovery.",
  "Round saved. {count} new questions.": "Ronde disimpan. {count} pertanyaan baru.",
  "Save version": "Simpan versi",
  "Saved as version {version}.": "Disimpan sebagai versi {version}.",
  "Saving…": "Menyimpan…",
  "Scope & constraints": "Scope & constraint",
  "Security controls": "Kontrol keamanan",
  "Security, performance, reliability, accessibility, privacy, and operations with measurable targets.":
    "Keamanan, performa, reliability, aksesibilitas, privasi, dan operasi dengan target terukur.",
  "Shared language for humans and coding agents.":
    "Bahasa bersama untuk manusia dan coding agent.",
  Should: "Sebaiknya",
  Stack: "Stack",
  "Stack, entities, API contracts, security controls, and deployment expectations.":
    "Stack, entity, kontrak API, kontrol keamanan, dan ekspektasi deployment.",
  Steps: "Langkah",
  "Steps — one per line: actor | action | outcome": "Langkah — satu per baris: aktor | aksi | hasil",
  Strategy: "Strategi",
  "Success metrics": "Metrik sukses",
  Target: "Target",
  "Technical blueprint": "Technical blueprint",
  Term: "Istilah",
  "Test levels": "Level test",
  "The end-to-end path, including the trigger and the successful outcome.":
    "Jalur end-to-end, termasuk trigger dan hasil suksesnya.",
  Title: "Judul",
  "UX flow name": "Nama UX flow",
  "UX requirements": "UX requirement",
  "Unknowns stay visible. A blocking question prevents export until it is resolved or explicitly downgraded.":
    "Hal yang belum diketahui tetap terlihat. Pertanyaan yang memblokir akan menahan ekspor sampai diselesaikan atau diturunkan statusnya.",
  Untitled: "Tanpa judul",
  "User journeys": "User journey",
  "Version / date": "Versi / tanggal",
  "Version history": "Riwayat versi",
  "What ships, what does not, and what the plan assumes to be true.":
    "Apa yang dirilis, apa yang tidak, dan apa yang diasumsikan benar oleh rencana.",
  "Won't": "Tidak",
  complete: "selesai",
  milestones: "milestone",
  "model name": "nama model",
  traced: "terlacak",
  wireframe: "wireframe",
  "{count} question is unanswered. Answer or use an assumption.":
    "{count} pertanyaan belum dijawab. Jawab atau gunakan asumsi.",
  "{count} questions are unanswered. Answer or use an assumption.":
    "{count} pertanyaan belum dijawab. Jawab atau gunakan asumsi.",
  "{label} copied.": "{label} disalin.",
  "{name} configuration saved.": "Konfigurasi {name} disimpan.",
  "leave blank to keep": "biarkan kosong untuk mempertahankan",
  "{runs} runs · {input} input · {output} output tokens · ~${cost} estimated":
    "{runs} run · {input} input · {output} output token · ~${cost} estimasi",

  // Provider descriptions
  "GPT models through the OpenAI API.": "Model GPT melalui API OpenAI.",
  "One API for many hosted model providers.": "Satu API untuk banyak provider model hosted.",
  "Claude models through the Messages API.": "Model Claude melalui Messages API.",
  "Gemini models through the Generative Language API.":
    "Model Gemini melalui Generative Language API.",
  "Local models with an OpenAI-compatible endpoint.":
    "Model lokal dengan endpoint OpenAI-compatible.",
  "Cloud-hosted Ollama models using an API key.":
    "Model Ollama yang di-host di cloud menggunakan API key.",
  "Create an API key at ollama.com/settings/keys, then choose a model ID from the cloud model list.":
    "Buat API key di ollama.com/settings/keys, lalu pilih ID model dari daftar model cloud.",
  "Browse cloud models": "Lihat model cloud",
  "Get API key": "Dapatkan API key",
  "Ollama Cloud uses an OpenAI-compatible endpoint at ollama.com/v1. Create an API key, then enter a cloud model ID such as gemma4:31b.":
    "Ollama Cloud memakai endpoint OpenAI-compatible di ollama.com/v1. Buat API key, lalu masukkan ID model cloud seperti gemma4:31b.",
  "Ollama (local)": "Ollama (lokal)",
  "Custom endpoint": "Endpoint kustom",
  "Any OpenAI-compatible chat completions endpoint.":
    "Endpoint chat completions yang OpenAI-compatible.",

  // Product types
  "SaaS Platform": "Platform SaaS",
  "Internal Tool": "Tool Internal",
  "Mobile App": "Aplikasi Mobile",
  "Developer Tool": "Tool Developer",
  "E-commerce": "E-commerce",
  Fintech: "Fintech",
  Healthcare: "Kesehatan",
  Education: "Pendidikan",
  Logistics: "Logistik",
  "Custom Product": "Produk Kustom",
  "Internal tool": "Tool internal",

  // Coverage descriptions
  "The pain, evidence, and current state.": "Pain point, bukti, dan kondisi saat ini.",
  "Outcomes the product must achieve.": "Hasil yang harus dicapai produk.",
  "Who uses the product and why.": "Siapa yang memakai produk dan mengapa.",
  "End-to-end flows users perform.": "Alur end-to-end yang dilakukan user.",
  "Functional scope and priorities.": "Scope fungsional dan prioritas.",
  "Core entities and ownership.": "Entity inti dan kepemilikannya.",
  "External systems and APIs.": "Sistem eksternal dan API.",
  "Performance, reliability, accessibility.": "Performa, reliability, aksesibilitas.",
  "Access, privacy, and compliance.": "Akses, privasi, dan compliance.",
  "Timeline, budget, and platform limits.": "Timeline, budget, dan batasan platform.",
  "What is in and out of the release.": "Apa yang masuk dan keluar dari rilis.",
  "How success will be measured.": "Bagaimana keberhasilan diukur.",

  // CRM discovery questions
  "What sales or customer-management pain is the CRM meant to remove?":
    "Pain sales atau customer management apa yang ingin dihilangkan oleh CRM ini?",
  "Describe the current workflow, where revenue or time leaks, and any evidence you have.":
    "Jelaskan alur saat ini, di mana revenue atau waktu bocor, dan bukti yang Anda miliki.",
  "Leads slip through the cracks": "Lead terlewat",
  "No reliable pipeline visibility": "Visibilitas pipeline tidak andal",
  "Manual data entry slows the team": "Input data manual memperlambat tim",
  "Which CRM capabilities are non-negotiable for the first release?":
    "Kemampuan CRM apa yang wajib ada di rilis pertama?",
  "Think contacts, companies, deals, pipeline stages, activities, tasks, reporting, and permissions.":
    "Pikirkan kontak, perusahaan, deal, stage pipeline, aktivitas, task, reporting, dan permission.",
  "Contact and company management": "Manajemen kontak dan perusahaan",
  "Visual deal pipeline": "Pipeline deal visual",
  "Activity timeline": "Timeline aktivitas",
  "Reporting dashboard": "Dashboard reporting",
  "Which core records must the CRM own, and who owns each record?":
    "Record inti apa yang harus dimiliki CRM, dan siapa pemilik setiap record?",
  "For example: leads, contacts, companies, deals, activities, notes, and custom fields.":
    "Misalnya: lead, kontak, perusahaan, deal, aktivitas, catatan, dan custom field.",
  "Contacts and companies": "Kontak dan perusahaan",
  "Deals and pipeline stages": "Deal dan stage pipeline",
  "Activities and notes": "Aktivitas dan catatan",

  // Marketplace discovery questions
  "Which side of the marketplace is underserved today, and what breaks for them?":
    "Sisi marketplace mana yang belum terlayani, dan apa yang bermasalah bagi mereka?",
  "Separate buyer pain from seller or operator pain, and include current workarounds.":
    "Pisahkan pain buyer dari pain seller atau operator, dan sertakan workaround saat ini.",
  "Buyers cannot find trustworthy supply": "Buyer sulit menemukan supply yang tepercaya",
  "Sellers lack demand": "Seller kekurangan demand",
  "Operators manage transactions manually": "Operator mengelola transaksi secara manual",
  "What must the first marketplace release support end to end?":
    "Apa yang harus didukung rilis marketplace pertama secara end-to-end?",
  "Consider onboarding, catalog, search, checkout, payments, fulfillment, reviews, and moderation.":
    "Pertimbangkan onboarding, katalog, search, checkout, payment, fulfillment, review, dan moderasi.",
  "Seller onboarding": "Onboarding seller",
  "Catalog and search": "Katalog dan search",
  "Checkout and payments": "Checkout dan payment",
  "Reviews and moderation": "Review dan moderasi",

  // SaaS discovery questions
  "What recurring workflow problem should this SaaS eliminate?":
    "Masalah workflow berulang apa yang harus dihilangkan SaaS ini?",
  "Name the team affected, the workaround they use today, and why it is expensive.":
    "Sebutkan tim yang terdampak, workaround saat ini, dan alasan biayanya mahal.",
  "Manual spreadsheets": "Spreadsheet manual",
  "Fragmented tools": "Tool yang terfragmentasi",
  "Slow onboarding": "Onboarding lambat",
  "Which workspace capabilities define the core product loop?":
    "Kemampuan workspace apa yang membentuk core product loop?",
  "Consider onboarding, the primary workspace, collaboration, notifications, billing, and admin controls.":
    "Pertimbangkan onboarding, workspace utama, collaboration, notification, billing, dan admin control.",
  "Authentication and workspaces": "Authentication dan workspace",
  "Core workspace": "Workspace inti",
  "Billing and plans": "Billing dan plan",
  "Admin console": "Admin console",

  // Internal tool discovery questions
  "Which internal process is slow, error-prone, or impossible to audit today?":
    "Proses internal mana yang lambat, rawan error, atau sulit diaudit saat ini?",
  "Describe the teams involved, approval steps, and the cost of mistakes.":
    "Jelaskan tim yang terlibat, langkah approval, dan biaya kesalahan.",
  "Manual approvals": "Approval manual",
  "Spreadsheet tracking": "Tracking via spreadsheet",
  "No audit trail": "Tidak ada audit trail",
  "Which internal workflow stages must the tool cover?":
    "Stage workflow internal apa yang harus dicakup tool ini?",
  "Think intake, assignment, approvals, status tracking, notifications, and reporting.":
    "Pikirkan intake, assignment, approval, status tracking, notification, dan reporting.",
  "Request intake": "Intake request",
  "Approval workflow": "Workflow approval",
  "Audit trail": "Audit trail",
  "Operations dashboard": "Dashboard operasional",

  // Default discovery questions
  "What specific problem should this product solve, and what happens if it is not solved?":
    "Masalah spesifik apa yang harus diselesaikan produk ini, dan apa dampaknya jika tidak?",
  "Include the affected user, the current workaround, and any evidence that the problem is real.":
    "Sertakan user terdampak, workaround saat ini, dan bukti bahwa masalahnya nyata.",
  "Manual work is too slow": "Pekerjaan manual terlalu lambat",
  "Data is fragmented": "Data terfragmentasi",
  "The current tool is hard to use": "Tool saat ini sulit dipakai",
  "What business or user outcomes must the first release achieve?":
    "Outcome bisnis atau user apa yang harus dicapai rilis pertama?",
  "State outcomes, not features. Include a measurable target where possible.":
    "Tulis outcome, bukan fitur. Sertakan target terukur jika memungkinkan.",
  "Reduce time on the core task": "Mengurangi waktu task inti",
  "Increase conversion": "Meningkatkan conversion",
  "Replace a manual process": "Menggantikan proses manual",
  "Who are the primary users, and what are their goals and frustrations?":
    "Siapa user utama, dan apa tujuan serta frustrasi mereka?",
  "List roles, not job titles alone. Mention frequency of use and technical comfort.":
    "Sebutkan peran, bukan hanya jabatan. Jelaskan frekuensi pemakaian dan kenyamanan teknis.",
  "Operations team": "Tim operasional",
  "End customers": "End customer",
  Administrators: "Administrator",
  "What is the single most important end-to-end journey a user must complete?":
    "Apa satu journey end-to-end paling penting yang harus diselesaikan user?",
  "Walk through the trigger, key steps, decision points, and successful outcome.":
    "Jelaskan trigger, langkah utama, decision point, dan hasil suksesnya.",
  "Sign up and reach first value": "Daftar dan mencapai value pertama",
  "Create and manage a core record": "Membuat dan mengelola core record",
  "Approve a request": "Menyetujui request",
  "Which capabilities are must-haves for the first usable release?":
    "Kemampuan apa yang wajib ada di rilis pertama yang usable?",
  "Keep this to the smallest set that delivers the core loop. Separate must-haves from later ideas.":
    "Batasi ke set terkecil yang menghasilkan core loop. Pisahkan must-have dari ide berikutnya.",
  "Core CRUD": "CRUD inti",
  "Search and filtering": "Search dan filtering",
  Notifications: "Notifikasi",
  Reporting: "Reporting",
  "What are the core data entities, and which fields or relationships matter most?":
    "Apa entity data inti, dan field atau relasi mana yang paling penting?",
  "Think about the nouns in the product: users, accounts, orders, requests, projects, messages.":
    "Pikirkan objek utama di produk: user, account, order, request, project, message.",
  "Users and roles": "User dan role",
  "Core business records": "Record bisnis inti",
  "Audit history": "Riwayat audit",
  "Which external systems, APIs, or data sources must be integrated?":
    "Sistem eksternal, API, atau sumber data apa yang harus diintegrasikan?",
  "Include identity, payments, email, storage, analytics, or internal services. Say if none are needed.":
    "Sertakan identity, payment, email, storage, analytics, atau service internal. Sebutkan jika tidak ada.",
  Email: "Email",
  Payments: "Payment",
  "Identity provider": "Identity provider",
  "None for MVP": "Tidak ada untuk MVP",
  "What non-functional expectations apply to performance, reliability, and accessibility?":
    "Ekspektasi non-functional apa yang berlaku untuk performa, reliability, dan aksesibilitas?",
  "For example response time, uptime, browser support, mobile support, or expected scale.":
    "Misalnya response time, uptime, dukungan browser, dukungan mobile, atau skala yang diharapkan.",
  "Sub-second core interactions": "Interaksi inti di bawah satu detik",
  "99.9% availability": "Availability 99,9%",
  "WCAG 2.1 AA": "WCAG 2.1 AA",
  "What access-control, privacy, or compliance rules must the product respect?":
    "Aturan access control, privacy, atau compliance apa yang harus dipatuhi produk?",
  "Describe roles, sensitive data, retention, audit requirements, and any regulation.":
    "Jelaskan role, data sensitif, retention, kebutuhan audit, dan regulasi yang berlaku.",
  "Role-based access": "Akses berbasis role",
  "Audit logging": "Audit logging",
  "Data export and deletion": "Ekspor dan penghapusan data",
  "What constraints shape delivery: timeline, budget, platform, team, or existing systems?":
    "Constraint apa yang membentuk delivery: timeline, budget, platform, tim, atau sistem yang ada?",
  "Name the fixed constraints and any assumptions the plan can safely make.":
    "Sebutkan constraint tetap dan asumsi yang aman dibuat oleh rencana.",
  "Small team": "Tim kecil",
  "Fixed launch date": "Tanggal rilis tetap",
  "Must reuse existing stack": "Harus memakai stack yang ada",
  "What is explicitly out of scope for the first release?":
    "Apa yang secara eksplisit di luar scope rilis pertama?",
  "Naming exclusions prevents scope creep and makes the task plan sharper.":
    "Menyebut pengecualian mencegah scope creep dan membuat rencana task lebih tajam.",
  "Native mobile app": "Aplikasi mobile native",
  "Advanced analytics": "Analytics lanjutan",
  "Third-party marketplace": "Marketplace pihak ketiga",
  "How will you know the first release is successful?":
    "Bagaimana Anda tahu rilis pertama berhasil?",
  "Choose a small set of product and business metrics with a baseline and target.":
    "Pilih sedikit metrik produk dan bisnis dengan baseline dan target.",
  "Activation rate": "Activation rate",
  "Weekly active users": "Weekly active user",
  "Task completion time": "Waktu penyelesaian task",
  "Error rate": "Error rate",
};

export function translate(
  language: Language,
  text: string,
  vars?: Record<string, string | number>,
): string {
  const raw = language === "id" ? id[text] ?? text : text;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = vars[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}

export function getDictionary(language: Language) {
  return {
    language,
    t: (text: string, vars?: Record<string, string | number>) =>
      translate(language, text, vars),
  };
}
