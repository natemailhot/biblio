-- The previous migration's DROP CONSTRAINT used a guessed name that didn't
-- match on the hosted project (auto-generated constraint names aren't
-- guaranteed identical across separately-created databases). Find and drop
-- the actual unique constraint on (session_id, challenge_id) by introspection.
do $$
declare
  rec record;
begin
  for rec in
    select c.conname
    from pg_constraint c
    join pg_class rel on rel.oid = c.conrelid
    where rel.relname = 'submitted_answers'
      and c.contype = 'u'
      and (
        select array_agg(a.attname order by a.attname)
        from unnest(c.conkey) k
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k
      ) = array['challenge_id', 'session_id']::name[]
  loop
    execute format('alter table submitted_answers drop constraint %I', rec.conname);
  end loop;
end $$;
