-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Acesso" (
    "id" SERIAL NOT NULL,
    "em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "Acesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AliquotaNcm" (
    "ncm" TEXT NOT NULL,
    "ii" DOUBLE PRECISION NOT NULL,
    "ipi" DOUBLE PRECISION NOT NULL,
    "pis" DOUBLE PRECISION NOT NULL,
    "cofins" DOUBLE PRECISION NOT NULL,
    "exigeLpco" BOOLEAN NOT NULL DEFAULT false,
    "lpco" DOUBLE PRECISION,

    CONSTRAINT "AliquotaNcm_pkey" PRIMARY KEY ("ncm")
);

-- CreateTable
CREATE TABLE "AliquotaUf" (
    "uf" TEXT NOT NULL,
    "icms" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "AliquotaUf_pkey" PRIMARY KEY ("uf")
);

-- CreateTable
CREATE TABLE "Taxa" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Taxa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cambio" (
    "moeda" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Cambio_pkey" PRIMARY KEY ("moeda")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Simulacao" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dados" JSONB NOT NULL,
    "resultado" JSONB NOT NULL,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "Simulacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nome_key" ON "Categoria"("nome");

-- AddForeignKey
ALTER TABLE "Acesso" ADD CONSTRAINT "Acesso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simulacao" ADD CONSTRAINT "Simulacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
