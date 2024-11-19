-- CreateTable
CREATE TABLE "UserInstagram" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "status" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "InstagramSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "session" TEXT NOT NULL,
    "cookieJar" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InstagramSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserInstagram" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UsersFacebook" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "userInstagram" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Arsip" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama_arsip" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DetailContent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "file_path" TEXT NOT NULL,
    "media_type" INTEGER NOT NULL,
    "folderArsipId" INTEGER NOT NULL,
    CONSTRAINT "DetailContent_folderArsipId_fkey" FOREIGN KEY ("folderArsipId") REFERENCES "FolderArsip" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FolderArsip" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "caption" TEXT NOT NULL,
    "like" INTEGER NOT NULL,
    "coment" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "arsipId" INTEGER NOT NULL,
    CONSTRAINT "FolderArsip_arsipId_fkey" FOREIGN KEY ("arsipId") REFERENCES "Arsip" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UserInstagram_name_key" ON "UserInstagram"("name");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramSession_userId_key" ON "InstagramSession"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Arsip_nama_arsip_key" ON "Arsip"("nama_arsip");

-- CreateIndex
CREATE UNIQUE INDEX "DetailContent_folderArsipId_key" ON "DetailContent"("folderArsipId");
