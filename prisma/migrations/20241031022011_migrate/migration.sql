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
    "arsipId" INTEGER NOT NULL,
    CONSTRAINT "FolderArsip_arsipId_fkey" FOREIGN KEY ("arsipId") REFERENCES "Arsip" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Arsip_nama_arsip_key" ON "Arsip"("nama_arsip");

-- CreateIndex
CREATE UNIQUE INDEX "DetailContent_folderArsipId_key" ON "DetailContent"("folderArsipId");
