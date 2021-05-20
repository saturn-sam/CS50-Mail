document.addEventListener('DOMContentLoaded', function() {
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').onsubmit = send_email;

  var message = "";
  load_mailbox('inbox');
});
function compose_email() {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  document.getElementById('error-message').innerHTML='';
}
function send_email() {
  const mail_recipients = document.getElementById('compose-recipients').value;
  const mail_subject = document.getElementById('compose-subject').value;
  const mail_body = document.getElementById('compose-body').value;
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: mail_recipients,
      subject: mail_subject,
      body: mail_body
    })
  }).then(response => response.json()).then(result => {
        if ("message" in result) {
            
            message = result['message'];
            load_mailbox('sent', message);
        }
        if ("error" in result) {
            // show_message(result["error"]);
            document.querySelector('#error-message').innerHTML = result['error'];

        }
 
      }).catch(error => {
            console.log(error);
        });
  return false;
}

function load_mailbox(mailbox, message) {
  if (message){
    document.querySelector('#error-message').innerHTML = message;
  }else{
    document.querySelector('#error-message').innerHTML = "";
  }
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-detail-view').innerHTML= '';
  // document.querySelector('#read-email').style.display = 'none';
  document.querySelector('#emails-view').innerHTML = '';
  // document.getElementById('error-message').innerHTML='';


  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Update the mailbox with the latest emails to show for this mailbox.
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      if(emails.length>0){
        console.log(emails);
        let ediv = document.createElement('div');
        let tbl = document.createElement('table');
        tbl.classList.add("table","table-bordered");
        let thead = document.createElement('thead');
        thead.innerHTML = `<tr>
                            <th scope="col">Sender</th>
                            <th scope="col">Subject</th>
                            <th scope="col">Date</th>
                          </tr>`;
        tbody = document.createElement('tbody');
        tbody.innerHTML = "";
        emails.forEach(email => {
          tbody_tr = document.createElement('tr');
          if (mailbox === "sent"){
            tbody_tr.classList.add("email-list-row");
          } else{
            tbody_tr.classList.add("email-list-row", email["read"] ? "read" : "unread");
          }
          
          tbody_tr.innerHTML += `
                              <td id="sam">${email["sender"]}</td>
                              <td>${email["subject"]}</td>
                              <td>${email["timestamp"]}</td>
                            `;
          tbody.appendChild(tbody_tr);
          tbody_tr.addEventListener('click', () => show_email(email["id"], mailbox));
        })
        
        tbl.appendChild(thead);
        tbl.appendChild(tbody);
        ediv = ediv.appendChild(tbl);
        document.querySelector('#emails-view').append(ediv);
      
      }else{
        document.querySelector('#emails-view').innerHTML += "<h5>No Mails</h5>";
      }

    })
      .catch(error => console.log(error));

}

function show_email(email_id, mailbox) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-detail-view').style.display = 'block';

  document.querySelector('#emails-detail-view').innerHTML= '';

  fetch(`/emails/${email_id}`)
      .then(response => response.json())
      .then(email => {
        console.log(email)
        const from = document.createElement("div");
        const to = document.createElement("div");
        const subject = document.createElement("div");
        const timestamp = document.createElement("div");
        const reply_button = document.createElement("button");
        if (mailbox != "sent"){
          var archive_button = document.createElement("button");
        }
        
        const body = document.createElement("div");

        from.innerHTML = `<strong>From: </strong> ${email["sender"]}`;
        to.innerHTML = `<strong>To:</strong> ${email["recipients"]}`;
        subject.innerHTML = `<strong>Subject: </strong> ${email["subject"]}`;
        timestamp.innerHTML = `<strong>Timestamp: </strong> ${email["timestamp"]}`;
        body.innerHTML = email["body"];

          // * Archive button
          if (mailbox != "sent"){
            if (email["archived"]) {
              archive_button.innerHTML += "Unarchive";
            } else {
              archive_button.innerHTML += "Archive";
            }
            archive_button.classList = "btn btn-primary m-2";
            archive_button.addEventListener("click", () => {
              archive_email(email);
              // load_mailbox("inbox");
            });
          }


        // * Reply button
        reply_button.innerHTML = 'Reply';
        reply_button.classList = "btn btn-primary m-2";
        reply_button.addEventListener("click", () => compose_reply(email));


        
        document.querySelector("#emails-detail-view").appendChild(from)
        document.querySelector("#emails-detail-view").appendChild(to);
        document.querySelector("#emails-detail-view").appendChild(subject);
        document.querySelector("#emails-detail-view").appendChild(timestamp);
        if (mailbox != "sent"){
          document.querySelector("#emails-detail-view").appendChild(archive_button);
        }
        
        document.querySelector("#emails-detail-view").appendChild(reply_button);
        document.querySelector("#emails-detail-view").appendChild(document.createElement("hr"));
        document.querySelector("#emails-detail-view").appendChild(body);


      })
      .catch(error =>console.log(error));

      read_email_status(email_id)

}

function read_email_status(email_id){
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  }).then();
}

function archive_email(email) {
  fetch(`/emails/${email["id"]}`, {
    method: "PUT",
    body: JSON.stringify({
      archived: !email["archived"]
    })
  });
  load_mailbox("inbox");
}


function compose_reply(email) {
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#emails-detail-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";
  document.querySelector("#compose-recipients").value = email["sender"];
  document.querySelector("#compose-subject").value = ((email["subject"].match(/^(Re:)\s/)) ? email["subject"] : "Re: " + email["subject"]);
  document.querySelector("#compose-body").value = `\n\n-------------------------------------\nOn ${email["timestamp"]} ${email["sender"]} wrote:\n${email["body"]}\n-------------------------------------\n`;
}