// Zdefiniuj tutaj listę autoryzowanych adresów e-mail.
const AUTHORIZED_USERS = ['mrcn85@gmail.com', 'Piotr.clubluna@gmail.com', 'darekzaga@gmail.com', 'Management.lunanl@gmail.com']; 
const CLIENT_ID = '224351474213-rsi2j2r328adm26bi6rsp8476bopsg3s.apps.googleusercontent.com';

function validateToken(token) {
  try {
    const response = UrlFetchApp.fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    const payload = JSON.parse(response.getContentText());

    if (payload.aud !== CLIENT_ID) {
      throw new Error("Token ma nieprawidłowego odbiorcę (audience).");
    }
    
    if (!payload.email_verified) {
      throw new Error("Email użytkownika nie jest zweryfikowany.");
    }

    if (!AUTHORIZED_USERS.includes(payload.email)) {
      throw new Error(`Użytkownik ${payload.email} nie jest autoryzowany do wykonywania tej operacji.`);
    }
    
    return { email: payload.email }; // Zwraca obiekt użytkownika w przypadku sukcesu
  } catch (e) {
    Logger.log(`Błąd walidacji tokenu: ${e.toString()}`);
    return null; // Zwraca null w przypadku błędu
  }
}

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const idToken = request.token;
    
    const user = validateToken(idToken);
    if (!user) {
      throw new Error("Autoryzacja nie powiodła się. Nieprawidłowy token lub brak uprawnień.");
    }

    const sheetName = "Baza Danych";
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    
    if (!sheet) {
      throw new Error(`Nie można znaleźć arkusza o nazwie "${sheetName}".`);
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const action = request.action;
    const data = request.data;
    
    let responseMessage = "";

    if (action === 'update') {
      const idToUpdate = data.ID_Wydarzenia;
      const idColumnIndex = headers.indexOf('ID_Wydarzenia') + 1;
      
      if (idColumnIndex === 0) throw new Error("Nie znaleziono kolumny 'ID_Wydarzenia'.");

      const idColumnValues = sheet.getRange(2, idColumnIndex, sheet.getLastRow(), 1).getValues();
      let rowIndexToUpdate = -1;
      
      for (let i = 0; i < idColumnValues.length; i++) {
        if (idColumnValues[i][0] == idToUpdate) {
          rowIndexToUpdate = i + 2;
          break;
        }
      }

      if (rowIndexToUpdate !== -1) {
        const rowData = headers.map(header => data[header] || '');
        sheet.getRange(rowIndexToUpdate, 1, 1, headers.length).setValues([rowData]);
        responseMessage = `Pomyślnie zaktualizowano wydarzenie: ${data.Nazwa_Wydarzenia}`;
      } else {
         const newRow = headers.map(header => data[header] || '');
         sheet.appendRow(newRow);
         responseMessage = `Nie znaleziono istniejącego wpisu o ID ${idToUpdate}. Dodano jako nowe wydarzenie: ${data.Nazwa_Wydarzenia}`;
      }

    } else if (action === 'append') {
      const newRow = headers.map(header => data[header] || '');
      sheet.appendRow(newRow);
      responseMessage = `Pomyślnie dodano nowe wydarzenie: ${data.Nazwa_Wydarzenia}`;
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: responseMessage }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log(error.toString());
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
