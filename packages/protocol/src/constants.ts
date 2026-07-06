/** Wire format version for {@link ScenarioSnapshot}. Increment when snapshot shape changes. */
export const SNAPSHOT_VERSION = 7 as const;

/** Increment when generation logic would change output for the same (seed, difficulty). */
export const GENERATOR_VERSION = 8;
