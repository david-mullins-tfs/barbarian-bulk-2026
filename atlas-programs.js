(function(root){
  'use strict';
  const BULK_ID='barbarian-bulk', CUT_ID='conan-cut';
  const CONAN_CUT={
    Monday:{focus:'Upper A — Arms + Shoulders Focus',exercises:[
      ['Incline Press',3,6,10],['Seated Shoulder Press',3,8,12],['Lateral Raise',3,12,15],
      ['Barbell Curl',3,8,12],['Overhead Cable Triceps Extension',3,10,15],['Face Pulls',2,12,15]
    ]},
    Tuesday:{focus:'Lower A — Quad Focus',exercises:[
      ['Leg Extensions',3,10,15],['Seated Leg Curl',3,10,15],['Leg Press',3,6,10],['Walking Lunges',3,8,10]
    ]},
    Wednesday:{focus:'Abs & Calves',exercises:[
      ['Hanging Knee Raises',3,10,15],['Machine Crunches',3,12,15],
      ['Standing Calf Raise Smith Machine',4,10,15],['Plate-Loaded Seated Calf Raise',3,12,15]
    ]},
    Thursday:{focus:'Upper B — Arms + Shoulders Focus',exercises:[
      ['Close-Grip Bench',3,6,10],['Lateral Raise',3,12,15],['Preacher Curl Machine',3,8,12],
      ['Dip Machine',3,8,12],['Hammer Curls Dumbbell',2,10,12],['Rear Delt Fly on Bench',2,12,15]
    ]},
    Friday:{focus:'Lower B — Posterior Focus',exercises:[
      ['Romanian Deadlift',3,6,10],['Leg Press (Feet Higher)',3,8,12],['Seated Leg Curl',3,10,15],
      ['Leg Extensions (Lighter)',3,12,15],['Standing Calf Press Smith Machine',3,12,15]
    ]}
  };
  const DETAILS={
    [BULK_ID]:{id:BULK_ID,name:'Barbarian Bulk',short:'Barbarian Bulk',weeks:12,goal:'Muscle and strength development'},
    [CUT_ID]:{id:CUT_ID,name:'Winter Specialization — Conan Cut',short:'Conan Cut',weeks:12,goal:'Fat loss · Arms and shoulders specialization'}
  };
  const NO_ART=new Set([
    'Incline Press','Seated Shoulder Press','Barbell Curl','Overhead Cable Triceps Extension','Face Pulls',
    'Leg Extensions','Seated Leg Curl','Walking Lunges','Hanging Knee Raises','Machine Crunches',
    'Standing Calf Raise Smith Machine','Preacher Curl Machine','Dip Machine','Hammer Curls Dumbbell',
    'Rear Delt Fly on Bench','Romanian Deadlift','Leg Press (Feet Higher)',
    'Leg Extensions (Lighter)','Standing Calf Press Smith Machine'
  ]);
  root.AtlasPrograms={BULK_ID,CUT_ID,CONAN_CUT,DETAILS,NO_ART};
})(typeof window!=='undefined'?window:globalThis);
