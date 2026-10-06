import type {
  ActiveStudyTimer,
} from "../types/timer";

export function getElapsedMilliseconds(
  timer: ActiveStudyTimer,
  currentTime: number = Date.now()
): number {
  const startedAt =
    new Date(
      timer.startedAt
    ).getTime();

  if (Number.isNaN(startedAt)) {
    return 0;
  }

  let endTime = currentTime;

  if (
    timer.status === "paused" &&
    timer.pausedAt
  ) {
    const pausedAt =
      new Date(
        timer.pausedAt
      ).getTime();

    if (!Number.isNaN(pausedAt)) {
      endTime = pausedAt;
    }
  }

  const elapsed =
    endTime -
    startedAt -
    timer.totalPausedMs;

  return Math.max(
    0,
    elapsed
  );
}

export function formatElapsedTime(
  milliseconds: number
): string {
  const totalSeconds =
    Math.floor(
      milliseconds / 1000
    );

  const hours =
    Math.floor(
      totalSeconds / 3600
    );

  const minutes =
    Math.floor(
      (totalSeconds % 3600) /
        60
    );

  const seconds =
    totalSeconds % 60;

  return [
    hours,
    minutes,
    seconds,
  ]
    .map((value) =>
      value
        .toString()
        .padStart(2, "0")
    )
    .join(":");
}