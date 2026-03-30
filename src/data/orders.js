export const INITIAL_ORDERS = [
  { id:"PO-2026-042", supplier:"US Foods",    items:["Fresh Mozzarella","Ricotta","Burrata","Prosciutto di Parma"], total:612.00, status:"Delivered",  orderDate:"2026-03-20", deliveryDate:"2026-03-22",
    lineItems:[{id:5,qty:20},{id:7,qty:15},{id:8,qty:24},{id:9,qty:10}] },
  { id:"PO-2026-041", supplier:"US Foods",    items:["Pancetta","Italian Sausage","San Marzano Tomatoes","Baby Arugula"], total:348.50, status:"In Transit", orderDate:"2026-03-25", deliveryDate:"2026-03-30",
    lineItems:[{id:11,qty:10},{id:10,qty:20},{id:13,qty:48},{id:16,qty:10}] },
  { id:"PO-2026-040", supplier:"Sam's Club",  items:['00 Flour','Semolina Flour','EVOO','Pizza Boxes (12")'], total:285.00, status:"Pending",    orderDate:"2026-03-27", deliveryDate:"2026-04-01",
    lineItems:[{id:1,qty:100},{id:2,qty:50},{id:4,qty:12},{id:19,qty:200}] },
  { id:"PO-2026-039", supplier:"US Foods",    items:["Fresh Mozzarella","Parmigiano-Reggiano","Fresh Basil","Garlic"], total:294.00, status:"Delivered",  orderDate:"2026-03-15", deliveryDate:"2026-03-17",
    lineItems:[{id:5,qty:20},{id:6,qty:10},{id:14,qty:40},{id:15,qty:15}] },
  { id:"PO-2026-038", supplier:"Sam's Club",  items:["00 Flour","Sea Salt","Oak Logs","To-Go Containers"], total:512.00, status:"Delivered",  orderDate:"2026-03-10", deliveryDate:"2026-03-12",
    lineItems:[{id:1,qty:150},{id:3,qty:25},{id:17,qty:2},{id:20,qty:300}] },
];
