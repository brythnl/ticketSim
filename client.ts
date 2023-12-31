import * as readline from 'readline'
import WebSocket from 'ws';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

interface Ticket {
  id: number;
  clientId: string;
}

let tickets: Ticket[] = [];

// Set up WebSocket connection to server
const ws = new WebSocket('ws://localhost:8080/ws');

ws.on('open', () => {
  console.log('Client gestartet');

  // Prompt for client ID
  rl.question("Client-ID eingeben: ", clientId => {
    sendClientId(clientId);

    interact(clientId);
  });
});

// Receive data (list of all ticket information) from server
ws.on('message', message => {
  const data = JSON.parse(message.toString());
  tickets = data.tickets;
})

const sendClientId = (clientId: string) => {
  ws.send(JSON.stringify({
    message_type: "set_client_id",
    client_id: clientId
  }));
}

const interact = (clientId: string) => {
  console.log(`\nClient: ${clientId}`)

  displayTickets();

  rl.question("Nummer eingeben zur Selbstzuweisung, 'q' zum Beenden\n", input => {
    if (input === 'q') {
      ws.close();
      rl.close();
      process.exit();
    }

    const ticketId = parseInt(input);

    if (isNaN(ticketId)) {
      console.log("Bitte eine Nummer eingeben. Versuchen Sie nochmal.")
    } else if (ticketIsValid(ticketId)) {
      assignTicket(ticketId, clientId);
    }

    interact(clientId);
  })
}

const ticketIsValid = (ticketId: number): boolean => {
  for (const ticket of tickets) {
    if (ticket.id === ticketId) {
      if (ticket.clientId === "") {
        return true;
      } else {
        console.log(`Ticket mit der ID: ${ticketId} ist schon zugewiesen.`)
        return false;
      }
    }
  }

  console.log(`Ticket mit der ID: ${ticketId} ist nicht gefunden.`)
  return false;
}

const assignTicket = (ticketId: number, clientId: string) => {
  ws.send(JSON.stringify({
    message_type: "assign_ticket",
    ticket_id: ticketId,
    client_id: clientId
  }))
}

const displayTickets = () => {
  if (tickets.length === 0) {
    console.log("Keine Tickets");
  } else {
    for (const ticket of tickets) {
      console.log(`Ticket ID: ${ticket.id}, zugewiesen von: ${ticket.clientId}`)
    }
  }
}
