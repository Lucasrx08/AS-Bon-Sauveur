(() => {
'use strict';
const STORE='bs-app-data-v4';
const VERSION='v5-20260907-2';
if(!localStorage.getItem(STORE)){
  const sizes=['7/8 ans','9/11 ans','12/13 ans','XS','S','M','L','XL','XXL','XXXL','XXXXL'];
  const data={
    events:[
      {id:'e1',title:'Entraînement AS multisports',ageCategory:'Toutes catégories',specialty:'Association Sportive',date:'2026-09-09',startTime:'13:30',endTime:'16:00',place:'Gymnase du Bon Sauveur'},
      {id:'e2',title:'Entraînement section football',ageCategory:'Benjamin',specialty:'Section Football',date:'2026-09-10',startTime:'15:30',endTime:'17:30',place:'Stade'},
      {id:'e3',title:'Option escalade',ageCategory:'Minime fille',specialty:'Option Escalade',date:'2026-09-10',startTime:'15:30',endTime:'18:00',place:'Salle d’escalade'},
      {id:'e4',title:'Sport-études gymnastique',ageCategory:'Toutes catégories',specialty:'Sport-études Gymnastique',date:'2026-09-08',startTime:'14:30',endTime:'18:45',place:'Saint-Loise Gymnastique'},
      {id:'e5',title:'UGSEL Football — secteur',ageCategory:'Benjamin',specialty:'Section Football',date:'2026-09-23',startTime:'12:45',endTime:'17:30',place:'Saint-Lô',convocationId:'c1'}
    ],
    documents:[
      {id:'d1',title:'Règlement de l’Association Sportive',specialty:'Association Sportive',date:'2026-09-01',description:'Règles de fonctionnement et informations utiles.',url:'#',featured:true},
      {id:'d2',title:'Horaires section football',specialty:'Section Football',date:'2026-09-01',description:'Horaires hebdomadaires de la section.',url:'#',featured:true},
      {id:'d3',title:'Horaires option escalade',specialty:'Option Escalade',date:'2026-09-01',description:'Organisation et horaires de l’option.',url:'#',featured:true}
    ],
    products:[
      {id:'p1',name:'Sweat officiel',description:'Sweat aux couleurs de l’Association Sportive.',price:35,sizes:[...sizes],colors:['Bleu (Sapphire Blue)','Gris (Graphite Heather)','Jaune (Gold)'],image:'assets/shop-sweat-sapphire.webp',paymentMethods:['Espèces','Virement','Chèque'],deadline:'2026-10-05',paymentLink:'',active:true},
      {id:'p2',name:'T-shirt Association Sportive',description:'T-shirt technique.',price:15,sizes:[...sizes],colors:['Bleu (Sky Blue)'],image:'assets/shop-tshirt-skyblue.webp',paymentMethods:['Espèces','Virement','Chèque'],deadline:'2026-10-05',paymentLink:'',active:true}
    ],
    orders:[{id:'o1',productId:'p2',studentName:'MARTIN Léo',className:'5e Jacqueline AURIOL',size:'M',color:'Bleu (Sky Blue)',quantity:1,paymentMethod:'Chèque',paid:true,ready:false,distributed:false,createdAt:'2026-09-07'}],
    students:[
      {id:'s1',fullName:'DUPONT Emma',className:'6e AVIGNON',specialty:'Sport-études Gymnastique'},
      {id:'s2',fullName:'MARTIN Léo',className:'5e Jacqueline AURIOL',specialty:'Section Football'},
      {id:'s3',fullName:'BERNARD Inès',className:'4e Cyril MORE',specialty:'Option Escalade'},
      {id:'s4',fullName:'THOMAS Jade',className:'5e Bessie COLEMAN',specialty:'Section Football'}
    ],
    appreciations:[
      {id:'a1',studentId:'s2',term:1,text:'Très bonne implication dans les séances.',status:'validated'},
      {id:'a2',studentId:'s3',term:1,text:'Bon trimestre.',status:'draft'}
    ],
    licenses:[
      {id:'l1',studentId:'s1',fullName:'DUPONT Emma',className:'6e AVIGNON',category:'Benjamine',contribution:'Chèque',paymentStatus:'Payé',amount:20,charterSigned:'Oui',sectionOption:'Sport-études Gymnastique'},
      {id:'l2',studentId:'s2',fullName:'MARTIN Léo',className:'5e Jacqueline AURIOL',category:'Benjamin',contribution:'Espèces',paymentStatus:'Payé',amount:20,charterSigned:'Oui',sectionOption:'Section Football'},
      {id:'l3',studentId:'s3',fullName:'BERNARD Inès',className:'4e Cyril MORE',category:'Minime fille',contribution:'Ticket Spot 50',paymentStatus:'En attente',amount:20,charterSigned:'Oui',sectionOption:'Option Escalade'},
      {id:'l4',studentId:'s4',fullName:'THOMAS Jade',className:'5e Bessie COLEMAN',category:'Benjamine',contribution:'Cart’@too',paymentStatus:'Payé',amount:20,charterSigned:'Oui',sectionOption:'Section Football'}
    ],
    convocations:[{id:'c1',title:'UGSEL Football — secteur',activity:'Football',ageCategory:'Benjamin',specialty:'Section Football',date:'2026-09-23',departure:'12:45',returnTime:'17:30',place:'Saint-Lô',meetingPoint:'Porche du Bon Sauveur',equipment:'Tenue de sport, gourde',extraInfo:'Prévoir le repas du midi.',studentIds:['s2','s4']}],
    reports:[{id:'b1',date:'2026-09-02',activity:'Multisports',teacher:'Lucas RIGAUX',level:'Entraînement',place:'Bon Sauveur',category:'Toutes catégories',participants:34,comment:'Belle reprise, forte participation.'}],
    termSettings:{1:{deadline:'2026-11-30',end:'2026-12-11'},2:{deadline:'2027-03-12',end:'2027-03-19'},3:{deadline:'2027-06-11',end:'2027-06-25'}},
    instagram:[],users:[]
  };
  localStorage.setItem(STORE,JSON.stringify(data));
  localStorage.setItem('bs-v5-migrated',VERSION);
}
})();
