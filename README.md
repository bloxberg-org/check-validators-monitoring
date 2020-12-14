# check-validators-monitoring
A simple tool to periodically check the bloxberg validators and send them emails that are retrieved from Cobra contacts.

## Requirements
- nodejs
- npm

## Instructions

### Install the dependencies
```
npm install
```

### Get the contacts 

Export the techie and consoritum contacts in the .csv format. The file from Cobra should have the following fields: 
```
Haupt,Institution,Institut,Anrede,Titel,Vorname1,Nachname1,E-Mail1,Bemerkung
```

There are existing settings in Cobra CRM for exporting. To do that go to the tab Recherchieren. There select Stichwörter and select 'bloxberg techies'. In Data tab click Exportieren. In the settings there is an ready made formatting called 'Validator Monitoring - Techies'. Choose the setting and export the file. The file name must be `bloxberg_techies.csv`.

Do the similar steps for all consortium contacts. Go to the tab Receherchieren. Select Stichwörter. This time choose only 'bloxberg consortium'. In Data tab click Exportieren. The formatting is call 'Validator Monitoring - Consortium'. Choose the setting and export the file. The file name must be `bloxberg_consortium.csv`.

Finally copy the files `bloxberg_techies.csv` and `bloxberg_consortium.csv` in the project root.

### Mail credentials
Copy the file `.env-template` to a new file called `.env`. Add the SMTP credentials for each variable. You can use a service like [Mailtap](https://mailtrap.io/) to test emails.

## Run 

Run the script with
```
node index.js
```
