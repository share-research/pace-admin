
alter table "public"."reviews" add foreign key ("reviewstate_id") references "public"."reviewstates"("id") on update no action on delete no action;