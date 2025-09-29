# 02 — Prisma schema (starter pointing to existing tables)

> Run `prisma db pull` first to generate real models, then **replace** with the curated mapping below. Keep `@@map` to original tables.

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  // We'll inject DATABASE_URL at runtime or via a temporary CLI env var.
  url      = env("DATABASE_URL")
}

model User {
  id           Int      @id @default(autoincrement()) @map("id")
  username     String   @map("username")
  realName     String?  @map("realname")
  email        String?  @map("email")
  password     String   @map("password")
  enabled      Int      @map("enabled")
  accessLevel  Int      @map("access_level")
  cookieString String?  @map("cookie_string")
  dateCreated  Int?     @map("date_created")
  lastVisit    Int?     @map("last_visit")

  @@map("mantis_user_table")
}

model Project {
  id          Int     @id @default(autoincrement()) @map("id")
  name        String  @map("name")
  status      Int     @map("status")
  enabled     Int     @map("enabled")
  viewState   Int     @map("view_state")
  accessMin   Int?    @map("access_min")
  description String? @map("description")

  @@map("mantis_project_table")
}

model ProjectUser {
  projectId  Int @map("project_id")
  userId     Int @map("user_id")
  accessLevel Int @map("access_level")

  project Project @relation(fields: [projectId], references: [id])
  user    User    @relation(fields: [userId], references: [id])

  @@id([projectId, userId])
  @@map("mantis_project_user_list_table")
}

model IssueText {
  id       Int     @id @default(autoincrement()) @map("id")
  description String? @map("description")
  stepsToReproduce String? @map("steps_to_reproduce")
  additionalInfo String?   @map("additional_information")

  @@map("mantis_bug_text_table")
}

model Issue {
  id           Int      @id @default(autoincrement()) @map("id")
  projectId    Int      @map("project_id")
  reporterId   Int      @map("reporter_id")
  handlerId    Int?     @map("handler_id")
  priority     Int      @map("priority")
  severity     Int      @map("severity")
  status       Int      @map("status")
  resolution   Int      @map("resolution")
  categoryId   Int?     @map("category_id")
  dateSubmitted Int     @map("date_submitted")
  lastUpdated   Int     @map("last_updated")
  bugTextId     Int     @map("bug_text_id")
  summary       String  @map("summary")
  // ... add more columns after introspection

  text IssueText @relation(fields: [bugTextId], references: [id])

  @@map("mantis_bug_table")
}

model IssueNoteText {
  id   Int     @id @default(autoincrement()) @map("id")
  note String? @map("note")
  @@map("mantis_bugnote_text_table")
}

model IssueNote {
  id       Int  @id @default(autoincrement()) @map("id")
  bugId    Int  @map("bug_id")
  reporter Int  @map("reporter_id")
  viewState Int @map("view_state")
  dateSubmitted Int @map("date_submitted")
  lastModified  Int @map("last_modified")
  noteTextId    Int @map("bugnote_text_id")

  text IssueNoteText @relation(fields: [noteTextId], references: [id])
  issue Issue @relation(fields: [bugId], references: [id])

  @@map("mantis_bugnote_table")
}

model Tag {
  id   Int    @id @default(autoincrement()) @map("id")
  name String @map("name")
  @@map("mantis_tag_table")
}

model IssueTag {
  bugId Int @map("bug_id")
  tagId Int @map("tag_id")

  issue Issue @relation(fields: [bugId], references: [id])
  tag   Tag   @relation(fields: [tagId], references: [id])

  @@id([bugId, tagId])
  @@map("mantis_bug_tag_table")
}
```
