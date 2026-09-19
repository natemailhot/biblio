-- Product decision: shorten the Ascent timer to 25s. (Canon stays the
-- 66-book Protestant default — a Catholic-canon switch was tried and
-- reverted in this same migration before it shipped.)
alter table daily_challenges alter column duration_seconds set default 25;
