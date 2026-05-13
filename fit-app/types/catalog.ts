/** Diet row — mirror `server/data/diets.json` `items[]`. */
export type DietItem = {
  id: string;
  name: string;
  summary: string;
  foods?: string[];
  tags?: string[];
};

/** Exercise row — mirror `server/data/exercises.json` nesting. */
export type ExerciseEntry = {
  id: string;
  name: string;
  notes?: string;
};

export type ExerciseTypeGroup = {
  id: string;
  name: string;
  exercises: ExerciseEntry[];
};

export type MuscleGroup = {
  id: string;
  name: string;
  types: ExerciseTypeGroup[];
};

export type ExerciseSearchHit = {
  id: string;
  name: string;
  muscleGroupId: string;
  muscleGroupName: string;
  typeId: string;
  typeName: string;
  notes?: string;
};

export type AssignmentPayload = {
  id: string;
  createdAt: string;
  diets: { id: string; name: string }[];
  exercises: {
    id: string;
    name: string;
    typeName: string;
    muscleGroupName: string;
  }[];
};
