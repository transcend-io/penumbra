/* eslint-disable wrap-iife */

/**
 * Pre-populate the table with the file metadata, before they've downloaded
 */
(function buildTable() {
  const table = document.getElementById('table');
  const headerIds = Array.from(document.getElementById('headers').children).map(
    (child) => child.id,
  );

  window.files.forEach((file, i) => {
    const row = document.createElement('tr');

    headerIds.forEach((headerId) => {
      const cell = document.createElement('td');
      cell.id = `${i}-${headerId}`;
      // Key-specific handlers
      if (headerId === 'decryptionOptions') {
        cell.innerText = !!file[headerId];
      } else {
        cell.innerText = file[headerId] || '';
      }
      row.appendChild(cell);
    });

    table.appendChild(row);
  });
})();

// Insert file info into the table
/**
 * @param returnedFiles - Returned files
 */
window.insertIntoCell = function insertIntoCell(returnedFiles) {
  const headerIds = Array.from(document.getElementById('headers').children).map(
    (child) => child.id,
  );

  returnedFiles.forEach(async (returnedFile, i) => {
    const returnedFileObj = await returnedFile;
    Object.entries(returnedFileObj).forEach(([key, value]) => {
      if (!headerIds.includes(key)) {
        return;
      }
      const cell = document.getElementById(`${i}-${key}`);

      if (key === 'data' && returnedFileObj.type === 'uri') {
        // Display media
        const elementType = returnedFileObj.mimetype.split('/')[0];

        let media;
        if (elementType === 'image') {
          media = document.createElement('img');
        } else if (elementType === 'video') {
          media = document.createElement('video');
          media.autoplay = true;
          media.muted = true;
        }

        media.src = value;

        cell.appendChild(media);

        return;
      }
      cell.innerText = value.slice(0, 99);
    });
  });
};
/* eslint-enable wrap-iife */
