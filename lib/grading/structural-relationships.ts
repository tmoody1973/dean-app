export type RelationshipCheck = {
  readonly complete: boolean;
  readonly correctCount: number;
  readonly requiredCount: number;
  readonly satisfied: boolean;
};

/** Deterministically check index-aligned relationships declared by dragMatch. */
export function checkDeclaredRelationships(
  assignments: readonly (number | null)[],
  requiredCount: number,
): RelationshipCheck {
  const complete =
    Number.isInteger(requiredCount) &&
    requiredCount > 0 &&
    assignments.length === requiredCount &&
    assignments.every(
      (assignment) =>
        assignment !== null &&
        Number.isInteger(assignment) &&
        assignment >= 0 &&
        assignment < requiredCount,
    );
  const correctCount = assignments.reduce<number>(
    (count, rightIndex, leftIndex) =>
      count + (rightIndex === leftIndex ? 1 : 0),
    0,
  );

  return {
    complete,
    correctCount,
    requiredCount,
    satisfied: complete && correctCount === requiredCount,
  };
}
