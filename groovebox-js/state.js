const $=id=>document.getElementById(id);

const SEQUENCE_COUNT=4;
const STEPS_PER_SEQUENCE=16;

const tracks=[
  {name:"Kick",type:"kick",level:.86,mixerChannel:0,patterns:[[1,0,0,0,1,0,0,0,1,0,0,0,1,0,1,0],Array(STEPS_PER_SEQUENCE).fill(0),Array(STEPS_PER_SEQUENCE).fill(0),Array(STEPS_PER_SEQUENCE).fill(0)]},
  {name:"Snare",type:"snare",level:.56,mixerChannel:1,patterns:[[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],Array(STEPS_PER_SEQUENCE).fill(0),Array(STEPS_PER_SEQUENCE).fill(0),Array(STEPS_PER_SEQUENCE).fill(0)]},
  {name:"Closed Hat",type:"hat",level:.34,mixerChannel:2,patterns:[[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],Array(STEPS_PER_SEQUENCE).fill(0),Array(STEPS_PER_SEQUENCE).fill(0),Array(STEPS_PER_SEQUENCE).fill(0)]},
  {name:"Open Hat",type:"openhat",level:.22,mixerChannel:3,patterns:[[0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0],Array(STEPS_PER_SEQUENCE).fill(0),Array(STEPS_PER_SEQUENCE).fill(0),Array(STEPS_PER_SEQUENCE).fill(0)]},
  {name:"Perc",type:"perc",level:.30,mixerChannel:4,patterns:[[0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1],Array(STEPS_PER_SEQUENCE).fill(0),Array(STEPS_PER_SEQUENCE).fill(0),Array(STEPS_PER_SEQUENCE).fill(0)]},
  {name:"Synth 2",type:"synth2",level:.34,mixerChannel:5,patterns:[[1,0,0,1,0,0,1,0,1,0,0,1,0,1,0,0],Array(STEPS_PER_SEQUENCE).fill(0),Array(STEPS_PER_SEQUENCE).fill(0),Array(STEPS_PER_SEQUENCE).fill(0)]},
  {name:"Synth 1",type:"synth",level:.38,mixerChannel:6,patterns:[[0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0],Array(STEPS_PER_SEQUENCE).fill(0),Array(STEPS_PER_SEQUENCE).fill(0),Array(STEPS_PER_SEQUENCE).fill(0)]}
];

let synth2Sequences=[
  [48,48,55,48,51,48,58,55,48,48,55,51,48,58,55,51],
  Array(STEPS_PER_SEQUENCE).fill(48),
  Array(STEPS_PER_SEQUENCE).fill(48),
  Array(STEPS_PER_SEQUENCE).fill(48)
];

let synthSequences=[
  [60,62,64,67,69,67,64,62,60,62,64,67,71,69,67,64],
  Array(STEPS_PER_SEQUENCE).fill(60),
  Array(STEPS_PER_SEQUENCE).fill(60),
  Array(STEPS_PER_SEQUENCE).fill(60)
];
