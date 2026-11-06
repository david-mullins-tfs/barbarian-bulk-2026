(function(){
  const LIBRARY = {
    'Barbell Back Squat': {category:'Legs', primary:'Quads', secondary:['Glutes','Hamstrings'], type:'compound', min:6,max:8,equipment:'Half Rack / Barbell', startingResistance:45},
    'Smith Machine Squat': {category:'Legs', primary:'Quads', secondary:['Glutes','Hamstrings'], type:'compound', min:6,max:8,equipment:'Smith Machine'},
    'Plate-Loaded Hack Squat': {category:'Legs', primary:'Quads', secondary:['Glutes','Hamstrings'], type:'compound', min:8,max:12,equipment:'Plate-Loaded Machine', startingResistance:105},
    'Plate-Loaded Seated Calf Raise': {category:'Legs', primary:'Calves', secondary:[], type:'isolation', min:10,max:15,equipment:'Plate-Loaded Machine', startingResistance:0},
    'Lunges': {category:'Legs', primary:'Quads', secondary:['Glutes','Hamstrings'], type:'compound', min:10,max:12,equipment:'Dumbbell/Barbell'},
    'Leg Press': {category:'Legs', primary:'Quads', secondary:['Glutes'], type:'compound', min:10,max:12,equipment:'Machine'},
    'Leg Curls': {category:'Legs', primary:'Hamstrings', secondary:[], type:'isolation', min:12,max:15,equipment:'Machine'},
    'Barbell Deadlift': {category:'Posterior Chain', primary:'Glutes', secondary:['Hamstrings','Back'], type:'compound', min:5,max:7,equipment:'Deadlift Area / Barbell', startingResistance:45},
    'Smith Machine Deadlift': {category:'Posterior Chain', primary:'Glutes', secondary:['Hamstrings','Back'], type:'compound', min:5,max:7,equipment:'Smith Machine'},
    'RDL': {category:'Posterior Chain', primary:'Hamstrings', secondary:['Glutes','Back'], type:'compound', min:8,max:10,equipment:'Barbell/Dumbbell'},
    'Yes Machine': {category:'Legs', primary:'Abductors', secondary:[], type:'isolation', min:12,max:15,equipment:'Machine'},
    'No Machine': {category:'Legs', primary:'Adductors', secondary:[], type:'isolation', min:12,max:15,equipment:'Machine'},
    'Barbell Bench Press': {category:'Chest', primary:'Chest', secondary:['Triceps','Front Delts'], type:'compound', min:6,max:8,equipment:'Half Rack / Barbell', startingResistance:45},
    'Smith Machine Bench Press': {category:'Chest', primary:'Chest', secondary:['Triceps','Front Delts'], type:'compound', min:6,max:8,equipment:'Smith Machine'},
    'Incline Bench': {category:'Chest', primary:'Chest', secondary:['Triceps','Front Delts'], type:'compound', min:8,max:10,equipment:'Barbell'},
    'DB Bench': {category:'Chest', primary:'Chest', secondary:['Triceps','Front Delts'], type:'compound', min:8,max:12,equipment:'Dumbbell'},
    'Pec Deck': {category:'Chest', primary:'Chest', secondary:['Front Delts'], type:'isolation', min:10,max:15,equipment:'Machine'},
    'DB Fly': {category:'Chest', primary:'Chest', secondary:['Front Delts'], type:'isolation', min:12,max:15,equipment:'Dumbbell'},
    'Cable Fly': {category:'Chest', primary:'Chest', secondary:['Front Delts'], type:'isolation', min:12,max:15,equipment:'Cable'},
    'Machine Chest Press': {category:'Chest', primary:'Chest', secondary:['Triceps','Front Delts'], type:'compound', min:8,max:12,equipment:'Machine'},
    'Plate-Loaded Chest Press': {category:'Chest', primary:'Chest', secondary:['Triceps','Front Delts'], type:'compound', min:8,max:12,equipment:'Plate-Loaded Machine', startingResistance:0},
    'Close-Grip Bench': {category:'Chest', primary:'Chest', secondary:['Triceps','Front Delts'], type:'compound', min:8,max:10,equipment:'Barbell', startingResistance:45},
    'Incline DB Press': {category:'Chest', primary:'Chest', secondary:['Triceps','Front Delts'], type:'compound', min:8,max:12,equipment:'Dumbbell'},
    'Overhead Press': {category:'Shoulders', primary:'Delts', secondary:['Triceps'], type:'compound', min:8,max:10,equipment:'Barbell'},
    'Seated DB Press': {category:'Shoulders', primary:'Delts', secondary:['Triceps'], type:'compound', min:10,max:12,equipment:'Dumbbell'},
    'Lateral Raise': {category:'Shoulders', primary:'Side Delts', secondary:[], type:'isolation', min:12,max:15,equipment:'Dumbbell/Cable'},
    'Rear Delt Fly': {category:'Shoulders', primary:'Rear Delts', secondary:[], type:'isolation', min:12,max:15,equipment:'Dumbbell/Machine'},
    'Pullups': {category:'Back', primary:'Back', secondary:['Biceps'], type:'compound', min:6,max:9,equipment:'Bodyweight'},
    'Assisted Chin-Ups': {category:'Back', primary:'Back', secondary:['Biceps'], type:'compound', min:8,max:12,equipment:'Machine'},
    'Lat Pulldown': {category:'Back', primary:'Back', secondary:['Biceps'], type:'compound', min:8,max:12,equipment:'Cable/Machine'},
    'Chest-Supported Row': {category:'Back', primary:'Back', secondary:['Biceps','Rear Delts'], type:'compound', min:10,max:12,equipment:'Machine/Dumbbell'},
    'Cable Row': {category:'Back', primary:'Back', secondary:['Biceps','Rear Delts'], type:'compound', min:8,max:12,equipment:'Cable'},
    'EZ Curl': {category:'Biceps', primary:'Biceps', secondary:[], type:'isolation', min:10,max:12,equipment:'EZ Bar'},
    'Incline DB Curl': {category:'Biceps', primary:'Biceps', secondary:[], type:'isolation', min:8,max:12,equipment:'Dumbbell'},
    'Hammer Curl': {category:'Biceps', primary:'Biceps', secondary:[], type:'isolation', min:10,max:15,equipment:'Dumbbell'},
    'Triceps Pushdown': {category:'Triceps', primary:'Triceps', secondary:[], type:'isolation', min:10,max:12,equipment:'Cable'},
  };
  const categories=[...new Set(Object.values(LIBRARY).map(x=>x.category))];
  function metadata(name){ return LIBRARY[name] || null; }
  function all(){ return Object.entries(LIBRARY).sort((a,b)=>a[0].localeCompare(b[0])).map(([name,data])=>({name,...data})); }
  window.BarbarianExercises={LIBRARY,categories,metadata,all};
})();
