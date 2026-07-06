-- STIKDEAD :: 004_missions
CREATE TABLE IF NOT EXISTS daily_missions (
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day           DATE   NOT NULL,
  missions      JSONB  NOT NULL,          -- [{id,label,goal,progress,coins,claimed}]
  chest_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (user_id, day)
);
