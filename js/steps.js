/**
 * ROLE: Step registry for 7 scenes
 * WHAT IT DOES:
 * - Scene 2 blocks downward progression until questions are complete
 */

export const steps = [
  { id: "scene1" },
  { id: "scene2", canAdvance: (state) => state.questions.isComplete },
  { id: "scene3" },
  { id: "scene4" },
  { id: "scene5" },
  { id: "scene6" },
  { id: "scene7" }
];

export function stepIndexById(id){
  return steps.findIndex(s => s.id === id);
}

export function stepById(id){
  return steps.find(s => s.id === id);
}
