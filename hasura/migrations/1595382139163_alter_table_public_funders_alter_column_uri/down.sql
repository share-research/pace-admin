
ALTER TABLE "public"."funders" ALTER COLUMN "uri" SET NOT NULL;
COMMENT ON COLUMN "public"."funders"."uri" IS E'null';