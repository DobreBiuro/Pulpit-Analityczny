// Ta funkcja jest wywoływana, gdy aplikacja frontendowa wysyła żądanie POST. To kod do Google Script App.
function doPost(e) {
  try {
    const sheetName = "database";
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    
    // Kluczowy krok: Sprawdzenie, czy arkusz o podanej nazwie istnieje.
    if (!sheet) {
      throw new Error(`Nie można znaleźć arkusza o nazwie "${sheetName}". Upewnij się, że nazwa zakładki w Arkuszu Google jest poprawna.`);
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    const data = request.data;
    
    let responseMessage = "";

    if (action === 'update') {
      const idToUpdate = data.ID_Wydarzenia;
      const idColumnIndex = headers.indexOf('ID_Wydarzenia') + 1;
      
      if (idColumnIndex === 0) {
        throw new Error("Nie znaleziono kolumny 'ID_Wydarzenia' w arkuszu.");
      }

      const idColumnValues = sheet.getRange(2, idColumnIndex, sheet.getLastRow(), 1).getValues();
      let rowIndexToUpdate = -1;
      
      for (let i = 0; i < idColumnValues.length; i++) {
        if (idColumnValues[i][0] == idToUpdate) {
          rowIndexToUpdate = i + 2; // +2 bo index jest od 0, a wiersze od 1 + nagłówek
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
