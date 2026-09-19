-- "Dive" is renamed to "Ascent" throughout the product (climbing toward
-- God's presence rather than diving). Session data so far is seed/test data,
-- so a straight column rename is safe.
alter table game_sessions rename column dive_score to ascent_score;
