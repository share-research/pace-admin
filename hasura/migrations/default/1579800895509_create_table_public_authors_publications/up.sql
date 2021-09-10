
CREATE TABLE "public"."authors_publications"("id" serial NOT NULL, "family_name" text NOT NULL, "given_name" text NOT NULL, "publication_id" integer NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("publication_id") REFERENCES "public"."publications"("id") ON UPDATE no action ON DELETE no action, UNIQUE ("id"));