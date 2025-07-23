/* eslint-disable wrap-iife */

/**
 * Pre-populate the table with the file metadata, before they've downloaded
 */
(async function buildTable() {
  // Wait for files to be loaded
  await new Promise((resolve) => {
    const interval = setInterval(() => {
      if (window.files.length > 0) {
        clearInterval(interval);
        resolve();
      }
    }, 50);
  });

  const table = document.getElementById('table');
  const headerIds = Array.from(document.getElementById('headers').children).map(
    (child) => child.id,
  );

  window.files.forEach((file, i) => {
    const row = document.createElement('tr');

    headerIds.forEach((headerId) => {
      const cell = document.createElement('td');
      const div = document.createElement('div');
      div.id = `${i}-${headerId}`;
      // Fill some table metadata based on the file metadata (the rest is filled by Penumbra's response)
      if (headerId === 'decryptionOptions') {
        div.innerText = !!file[headerId];
      } else if (headerId === 'url') {
        div.innerText = file[headerId] || '';
      }
      cell.appendChild(div);
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
          media.loop = true;
          media.controls = true;
        } else if (elementType === 'audio') {
          media = document.createElement('audio');
          media.controls = true;
        }
        if (media) {
          media.src = value;
          cell.appendChild(media);
        } else {
          const p = document.createElement('p');
          p.innerText = '<cannot display content>';
          const a = document.createElement('a');
          a.href = value;
          a.innerText = 'Download it instead';
          cell.appendChild(p);
          cell.appendChild(a);
        }

        return;
      }

      cell.innerText = value;
    });
  });
};
/* eslint-enable wrap-iife */
