# 09 — SQL Views (Compat Layer)

Put SQL under `/db/sql/views/*.sql` and load once:

- `v_issue_detail.sql`: join `mantis_bug_table` + `mantis_bug_text_table` → single row with description/steps/additional_info.
- `v_issue_last_change.sql`: aggregates from `mantis_bug_history_table` for quick timeline.
- `v_project_members.sql`: resolves project user emails + names.

> Views are optional but make queries simpler and keep Prisma models thin.
