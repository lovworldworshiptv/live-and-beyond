/** Native playback can resume many times; count one start per loaded title. */
export function createOnDemandStartTracker(record: () => void) {
  let started = false;
  return () => {
    if (started) return;
    started = true;
    record();
  };
}