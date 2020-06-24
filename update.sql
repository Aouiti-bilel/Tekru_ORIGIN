/*
By: Mohamed Kharrat
Date: 05/08/2019
Add created_at and updated_at to the tblEmployes table for the Sequelize requirments
*/
ALTER TABLE tblEmployes
  ADD createdAt VARCHAR (35),
      updatedAt VARCHAR (35);

ALTER TABLE tblEmployes_Niveaux
  ADD createdAt VARCHAR (35),
      updatedAt VARCHAR (35);

/*
By: Mohamed Kharrat
Date: 05/08/2019
Add cpwd as the encrypted password for the users
*/
ALTER TABLE tblEmployes
  ADD cpwd VARCHAR(100);

/*
By: Mohamed Kharrat
Date: 06/08/2019
Log and security for Password Reset
*/
CREATE TABLE tblPasswordReset (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ID_Emp INT NOT NULL,
    token VARCHAR (80) null,
    used BIT DEFAULT 0,
    createdAt VARCHAR (35),
    updatedAt VARCHAR (35)
);

/*
By: Mohamed Kharrat
Date: 13/08/2019
Add picture as the url for the user image
*/
ALTER TABLE tblEmployes
  ADD picture VARCHAR(250);

/*
By: Mohamed Kharrat
Date: 15/08/2019
Acces levels table
*/
CREATE TABLE tblAccess
(
  "id" INT IDENTITY(1,1) PRIMARY KEY,
  "accessName" VARCHAR (250) null,
  "slug" VARCHAR(50),
  "createdAt" VARCHAR (35),
  "updatedAt" VARCHAR (35)
);
CREATE TABLE tblAccessValues
(
  "id" INT IDENTITY(1,1) PRIMARY KEY,
  "levelId" INT NOT NULL,
  "accessId" INT NOT NULL,
  "value" BIT DEFAULT 0,
  "createdAt" VARCHAR (35),
  "updatedAt" VARCHAR (35)
);
/* tblAccess data */
INSERT INTO "tblAccess"
  ("accessName", "slug")
VALUES
  ('Allié RH', 'read_allierh'),
  ('Voir la liste des employées', 'edit_employee_list'),
  ('Activer/Désactiver employées', 'activate_deactivate_users'),
  ('Modifier la photo d''un employé', 'edit_employee_picture'),
  ('Modifier le lien du bouton iFrame Atlier RH dans le menu', 'edit_allierh'),
  ('Gestion des droits', 'edit_rights'),
  ('Modifier les utilisateurs', 'edit_user'),
  ('Configuration', 'config');
/* 
  tblAccessValues
  initiate the data, with all 0 access
  the level 1 (Administrateur) is granted all access with 1
 */
TRUNCATE TABLE "tblAccessValues";
INSERT INTO "tblAccessValues"
  ("levelId", "accessId", "value")
VALUES
  (1, 1, 1), (1, 2, 1), (1, 3, 1), (1, 4, 1), (1, 5, 1), (1, 6, 1), (1, 7, 1), /* Administrateur */
  (2, 1, 0), (2, 2, 0), (2, 3, 0), (2, 4, 0), (2, 5, 0), (2, 6, 0), (2, 7, 0), /* Adjointe */
  (3, 1, 0), (3, 2, 0), (3, 3, 0), (3, 4, 0), (3, 5, 0), (3, 6, 0), (3, 7, 0), /* Expert */
  (4, 1, 0), (4, 2, 0), (4, 3, 0), (4, 4, 0), (4, 5, 0), (4, 6, 0), (4, 7, 0), /* Utilisateur */
  (5, 1, 0), (5, 2, 0), (5, 3, 0), (5, 4, 0), (5, 5, 0), (5, 6, 0), (5, 7, 0), /* Pigiste */
  (6, 1, 0), (6, 2, 0), (6, 3, 0), (6, 4, 0), (6, 5, 0), (6, 6, 0), (6, 7, 0); /* Associé-expert */

/*
By: Mohamed Kharrat
Date: 16/08/2019
Option table
*/
CREATE TABLE "tblOptions"
(
  "id" INT IDENTITY(1,1) PRIMARY KEY,
  "name" VARCHAR (100) NOT NULL,
  "value" VARCHAR(MAX) NULL,
  "createdAt" VARCHAR (35),
  "updatedAt" VARCHAR (35)
);
INSERT INTO "tblOptions"
  ("name", "value")
VALUES
  ('email_default_address', 'noreply@origin.expert'),
  ('email_defautl_sender_name', 'Origin Expert'),
  ('email_subject_prefix', 'Origin'),
  ('token_life', '30d'),
  ('allierh_url', 'https://mwsserver.com/index.php?l=fr');

/**
 * By: Mohamed Kharrat
 * Date: 31/08/2019
 * Adding the access value to options
 */
ALTER TABLE "tblOptions"
  ADD "access" VARCHAR (250);
INSERT INTO "tblOptions"
  ("name", "value", "access")
VALUES
  ('home_background_image', '', 'public');

/**
 * By: Mohamed Kharrat
 * Date: 21/09/2019
 * Adding the access value to options
 */
ALTER TABLE "tblAccessValues"
  ADD "can_view" BIT DEFAULT 0,
      "can_view_own" BIT DEFAULT 0,
      "can_edit" BIT DEFAULT 0,
      "can_create" BIT DEFAULT 0,
      "can_delete" BIT DEFAULT 0;

/* Update the access slugs */
UPDATE "tblAccess"
  SET "slug" = 'permissions'
  WHERE "slug" = 'edit_rights';
UPDATE "tblAccess"
  SET "slug" = 'allierh'
  WHERE "slug" = 'read_allierh';
UPDATE "tblAccess"
  SET "slug" = 'users'
  WHERE "slug" = 'edit_user';
DELETE 
  FROM "tblAccess"
  WHERE "slug" in ('edit_employee_list', 'activate_deactivate_users', 'edit_employee_picture');
DELETE 
  FROM "tblAccessValues"
  WHERE "accessId" in (2, 3, 4);
DELETE 
  FROM "tblAccess"
  WHERE "slug" in ('edit_allierh');
DELETE 
  FROM "tblAccessValues"
  WHERE "accessId" in (5);


/*
 * Task #21: Module de gestion des Bloc de nouvelles 
 * Creat the table Content
 */

CREATE TABLE "tblContents" (
  "id" INT IDENTITY(1,1) PRIMARY KEY,
  "author_id" INT NOT NULL,
  "title" VARCHAR (MAX) NOT NULL,
  "content" TEXT NULL,
  "status" INT NOT NULL,
  "category" INT NULL DEFAULT 0,
  "excerpt" TEXT NULL,
  "slug" VARCHAR(300) NULL,
  "views" INT NOT NULL DEFAULT 0,
  "featured_image" VARCHAR(300) NULL,
  "createdAt" VARCHAR (35),
  "updatedAt" VARCHAR (35)
);

/* Add the content access to the Access table and grant view access to all */
INSERT INTO "tblAccess"
  ("accessName", "slug")
VALUES
  ('Bloc de nouvelles', 'content');

INSERT INTO "tblAccessValues"
  ("levelId", "accessId", "value", "can_view", "can_view_own")
VALUES
  (1, (SELECT MAX("id") FROM "tblAccess"), 1, 1, 1), /* Administrateur */
  (2, (SELECT MAX("id") FROM "tblAccess"), 1, 1, 1), /* Adjointe */
  (3, (SELECT MAX("id") FROM "tblAccess"), 1, 1, 1), /* Expert */
  (4, (SELECT MAX("id") FROM "tblAccess"), 1, 1, 1), /* Utilisateur */
  (5, (SELECT MAX("id") FROM "tblAccess"), 1, 1, 1), /* Pigiste */
  (6, (SELECT MAX("id") FROM "tblAccess"), 1, 1, 1); /* Associé-expert */

/* Updated on the dev server on the 23 dec 2019 */

INSERT INTO "tblAccess"
  ("accessName", "slug")
VALUES
  ('Administration de la plateforme', 'platform-admin');

INSERT INTO "tblAccessValues"
  ("levelId", "accessId", "value", "can_view")
VALUES
  (1, (SELECT MAX("id") FROM "tblAccess"), 1, 1), /* Administrateur */
  (2, (SELECT MAX("id") FROM "tblAccess"), 0, 0), /* Adjointe */
  (3, (SELECT MAX("id") FROM "tblAccess"), 0, 0), /* Expert */
  (4, (SELECT MAX("id") FROM "tblAccess"), 0, 0), /* Utilisateur */
  (5, (SELECT MAX("id") FROM "tblAccess"), 0, 0), /* Pigiste */
  (6, (SELECT MAX("id") FROM "tblAccess"), 0, 0); /* Associé-expert */

/* Updated on the dev server on the 24 dec 2019 */

/*
 * #19: Création du Controller, Model et Helpers du menu
 * Creat the table Menu
 */

CREATE TABLE "tblMenuItems" (
  "id" INT IDENTITY(1,1) PRIMARY KEY,
  "type" TINYINT DEFAULT 1, /* 1: module ; 2: Link ; 3: Category */
  "name" VARCHAR(250) NOT NULL,
  "icon" VARCHAR(50) NULL,
  "color" VARCHAR(6) NULL,
  "accessId" INT NULL,
  "order" TINYINT NULL,
  "parentId" INT NULL,
  "link" VARCHAR(200) NULL,
  "external" BIT NOT NULL DEFAULT 0,
  "createdBy" INT NOT NULL,
  "createdAt" VARCHAR (35),
  "updatedAt" VARCHAR (35)
);

CREATE TABLE "tblMenuItemsCategoryPages" (
  "id" INT IDENTITY(1,1) PRIMARY KEY,
  "menuItemId" INT NOT NULL,
  "title" VARCHAR(250) NOT NULL,
  "image" VARCHAR(300) NULL,
  "color_text" VARCHAR(6) NULL,
  "color_background" VARCHAR(6) NULL,
  "link" VARCHAR(200) NULL,
  "external" BIT NOT NULL DEFAULT 1,
  "order" TINYINT NULL,
  "createdBy" INT NOT NULL,
  "createdAt" VARCHAR (35),
  "updatedAt" VARCHAR (35)
);

INSERT INTO "tblMenuItems"
  ("type", "name", "icon", "accessId", "order", "createdBy")
VALUES
  (1, 'Tableau de bord', 'dashboard', NULL, 1, 1), 
  (1, 'Expert Sinistre', 'donut_large', NULL, 2, 1), 
  (1, 'Bloc de nouvelles', 'bookmarks', NULL, 3, 1), 
  (2, 'Allié RH', 'sentiment_satisfied', (SELECT "id" FROM "tblAccess" WHERE "slug" = 'allierh'), 4, 1), 
  (1, 'Indicateurs de performance', 'multiline_chart', NULL, 5, 1), 
  (1, 'Clients', 'group', NULL, 6, 1), 
  (2, 'Gestion documentaire', 'description', NULL, 7, 1), 
  (2, 'Santé et sécurité au travail', 'enhanced_encryption', NULL, 8, 1), 
  (1, 'Outils', 'build', NULL, 9, 1), 
  (2, 'Support TI', 'contact_support', NULL, 10, 1), 
  (2, 'Gestion GT', 'computer', NULL, 11, 1), 
  (2, 'Teams', 'question_answer', NULL, 12, 1);

/* Updated on the dev server on the 31 dec 2019 */

ALTER TABLE "tblMenuItems" ALTER COLUMN "color" VARCHAR (7) NULL;
ALTER TABLE "tblMenuItemsCategoryPages" ALTER COLUMN "color_text" VARCHAR (7) NULL;
ALTER TABLE "tblMenuItemsCategoryPages" ALTER COLUMN "color_background" VARCHAR (7) NULL;

/* Updated on the dev server on the 21 jan 2020 */

/*
By: Mohamed Kharrat
Date: 09/02/2020
Add pageFlag to the tblAccess table as as access for a page flag
*/
ALTER TABLE "tblAccess" ADD
  "pageFlag" BIT NULL DEFAULT 0;
UPDATE "tblAccess" SET "pageFlag" = 0;

/* Updated on the dev server on the 10 fev 2020 */

ALTER TABLE "tblContents" ADD "publishedAt" VARCHAR (35) NULL DEFAULT NULL;

/* Updated on the dev server on the 18 Feb 2020 */

INSERT INTO "tblOptions"
  ("name", "value", "access")
VALUES
  ('dbrd_wgt5_prctg_color', '[98,95]', 'public'),
  ('customers_type_color', '[{"type":"Assureur","color":"blue"},{"type":"Auto-assureur","color":"indigo"},{"type":"Avocat","color":"orange"},{"type":"Entreprise","color":"red"},{"type":"Expert en sinistres","color":"yellow"},{"type":"Secteur public","color":"gray"}]', 'public');

/*
 * By: Mohamed Kharrat
 * Date: 17/06/2020
**/
CREATE TABLE tblCalendarHolidays (
    [id] INT IDENTITY(1, 1) PRIMARY KEY,
    [name] VARCHAR (35) NULL,
    [date] VARCHAR (35),
    [createdAt] VARCHAR (35),
    [updatedAt] VARCHAR (35)
);

INSERT INTO [tblCalendarHolidays] ([date], [name]) VALUES
  ('2020-01-01 00:00:00', 'Jour de l''An'),
  ('2020-04-10 00:00:00', 'Vendredi saint'),
  ('2020-05-18 00:00:00', 'Fête de la Reine'),
  ('2020-07-01 00:00:00', 'Fête du Canada '),
  ('2020-08-03 00:00:00', 'Jour férié'),
  ('2020-09-07 00:00:00', 'Fête du travail'),
  ('2020-10-12 00:00:00', 'Action de grâce'),
  ('2020-11-11 00:00:00', 'Jour du Souvenir'),
  ('2020-12-25 00:00:00', 'Noël'),
  ('2020-12-26 00:00:00', 'Lendemain de Noël');
