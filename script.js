
let templateSaved = true;
let templateLoaded = false;

// Switching between tabs
function showTab(tabId) {
    const tabs = ['settings-tab', 'preview-tab'];
    tabs.forEach(tab => {
        document.getElementById(tab).style.display = (tab === tabId) ? 'block' : 'none';
    });

    if (tabId === 'preview-tab') {
        const firstLocaleButton = document.querySelector('#locale-buttons button');
        if (firstLocaleButton) {
            firstLocaleButton.click();
        } else {
            const emailTemplateContent = document.getElementById('email-template').value;
            document.getElementById('html-preview').innerHTML = emailTemplateContent;
            document.getElementById('html-source-preview').value = emailTemplateContent;
        }
    }
}


// Adding a new locale input for each placeholder
function addNewLocale() {
    const locale = prompt("Enter the new locale name (e.g. 'en', 'ja', etc.):");

    if (locale) {
        // Add a button for this locale in the preview section
        const localeButton = document.createElement('button');
        localeButton.innerText = locale;
        localeButton.onclick = () => loadPreview(locale);
        document.getElementById('locale-buttons').appendChild(localeButton);

        // Add locale input for each placeholder
        const placeholders = document.getElementById('placeholders-container').children;
        Array.from(placeholders).forEach(placeholder => {
            const localeInput = document.createElement('textarea');
            localeInput.placeholder = `Translation for ${locale}`;
            placeholder.appendChild(localeInput);
            
        });

        
    }
}


function saveTemplateToLocal() {
    const template = document.getElementById('email-template').value;
    const placeholders = {};

    const placeholderContainers = document.getElementById('placeholders-container').children;
    Array.from(placeholderContainers).forEach(container => {
        const placeholder = container.children[0].value;
        placeholders[placeholder] = {};

        const localeButtons = document.getElementById('locale-buttons').children;
        for (let i = 1; i < container.children.length; i++) {
            if (i-1 < localeButtons.length && localeButtons[i-1]) {
                const locale = localeButtons[i-1].innerText;
                placeholders[placeholder][locale] = container.children[i].value;
            }
        }
    });

    const dataToSave = { template, placeholders };
    const jsonData = JSON.stringify(dataToSave, null, 2); // Beautify the JSON

    // Create a blob and provide it as a download link
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary anchor element to trigger a download
    const a = document.createElement('a');
    const filename = document.getElementById('filename').textContent || 'templates';
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
}



function loadPreview(locale = null) {
    let emailTemplate = document.getElementById('email-template').value;

    // If a specific locale is provided, replace placeholders with that locale's translations
    if (locale) {
        const placeholders = document.getElementById('placeholders-container').children;
        for (const placeholder of placeholders) {
            const placeholderName = placeholder.querySelector('input').value;
            const translationArea = Array.from(placeholder.querySelectorAll('textarea')).find(textarea => textarea.placeholder.includes(locale));
            let translation = '';
            if (placeholderName && translationArea) { // Ensure translation value exists
                if(translationArea.value){
                    translation = translationArea.value;
                }
                const regex = new RegExp(escapeRegExp(placeholderName), 'g');
                emailTemplate = emailTemplate.replace(regex, translation);
            }
        }
    }

    // Load the email template into the HTML preview pane
    document.getElementById('html-source-preview').value = emailTemplate;
    document.getElementById('html-preview').innerHTML = emailTemplate;
}

// Helper function to escape special characters in strings for regular expressions
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


function loadTemplate() {
    if (!templateSaved && !templateLoaded) {
        const confirmation = confirm('You have unsaved changes. Are you sure you want to load a new template and discard these changes?');
        if (!confirmation) {
            return;
        }
    }

    const fileInput = document.getElementById('loadFileInput');
    const file = fileInput.files[0];

    if (file) {
        // Set the filename input to the loaded file's name without the extension
        const filenameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
        document.getElementById('filename').textContent = filenameWithoutExtension;

        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const content = event.target.result;
                const templateData = JSON.parse(content);

                if (!templateData.template) {
                    alert('The loaded JSON file does not contain the required "template" parameter.');
                    return;
                }

                // Update the textarea with the loaded template data
                document.getElementById('email-template').value = templateData.template;

                // Clear existing placeholders and locale buttons
                document.getElementById('placeholders-container').innerHTML = '';
                document.getElementById('locale-buttons').innerHTML = '';

                // Populate placeholders and locales based on the loaded template data
                for (const placeholder in templateData.placeholders) {
                    addNewPlaceholder(placeholder);
                    for (const locale in templateData.placeholders[placeholder]) {
                        addNewLocaleForPlaceholder(placeholder, locale, templateData.placeholders[placeholder][locale]);
                    }
                }

            } catch (e) {
                alert('Error parsing the JSON file. Please ensure the file is in the correct format.');
            }
        };
        reader.readAsText(file);
        templateLoaded = true;
    } else {
        alert('Please select a valid JSON template file.');
    }
}



function addNewPlaceholder(placeholderName = '') {
    const placeholderContainer = document.createElement('div');
    placeholderContainer.style.display = 'flex';

    const placeholderInput = document.createElement('input');
    placeholderInput.placeholder = "Enter placeholder e.g. $$hello$$";
    placeholderInput.value = placeholderName;

    // Create a delete button for the placeholder
    const deleteButton = document.createElement('button');
    deleteButton.innerText = 'Delete';
    deleteButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this placeholder?')) {
            placeholderContainer.remove();
            templateSaved = false;
            templateLoaded = false;
        }
    });

    // Optional: Add some styles or classes to the delete button
    deleteButton.style.marginLeft = '10px';

    placeholderContainer.appendChild(placeholderInput);  // Append input to the container first
    placeholderContainer.appendChild(deleteButton);  // Append the button next to the input

    placeholderInput.addEventListener('input', () => {
        templateSaved = false;
        templateLoaded = false;
    });

    const existingLocales = getExistingLocales();
    existingLocales.forEach(locale => {
        const localeInput = document.createElement('textarea');
        localeInput.placeholder = `Translation for ${locale}`;
        placeholderContainer.appendChild(localeInput);
    });

    document.getElementById('placeholders-container').appendChild(placeholderContainer);
}


// Adding a new locale input for a specific placeholder
function addNewLocaleForPlaceholder(placeholderName, locale = '', translation = '') {
    if (!locale) {
        locale = prompt("Enter the new locale name (e.g. 'en', 'ja', etc.):");
    }

    if (locale) {
        // Add a button for this locale in the preview section
        if (!document.querySelector(`#locale-buttons button[data-locale="${locale}"]`)) {
            const localeButton = document.createElement('button');
            localeButton.innerText = locale;
            localeButton.setAttribute('data-locale', locale);
            localeButton.onclick = () => loadPreview(locale);
            document.getElementById('locale-buttons').appendChild(localeButton);
        }

        // Add locale input for the provided placeholder
        const placeholders = document.getElementById('placeholders-container').children;
        Array.from(placeholders).forEach(placeholderDiv => {
            const placeholderInput = placeholderDiv.querySelector('input');
            if (placeholderInput.value === placeholderName) {
                let exists = false;
                Array.from(placeholderDiv.querySelectorAll('textarea')).forEach(input => {
                    if (input.placeholder === `Translation for ${locale}`) {
                        input.value = translation; // Update existing input value if it exists
                        exists = true;
                    }
                });

                if (!exists) {
                    const localeInput = document.createElement('textarea');
                    localeInput.placeholder = `Translation for ${locale}`;
                    localeInput.value = translation;
                    placeholderDiv.appendChild(localeInput);

                    localeInput.addEventListener('input', () => {
                        templateSaved = false;
                        templateLoaded = false;
                    });
                }
            }
        });
    }
}

function getExistingLocales() {
    const localeButtons = document.getElementById('locale-buttons').children;
    const locales = [];
    Array.from(localeButtons).forEach(button => {
        locales.push(button.innerText);
    });
    return locales;
}


function createNewTemplate() {
    if (!templateSaved) {
        const confirmNew = confirm("You have unsaved changes. Are you sure you want to create a new template?");
        if (!confirmNew) {
            return; // Do not proceed if user cancels
        }
    }

    // Reset all the fields and flags
    templateSaved = true;
    templateLoaded = false;
    document.getElementById('email-template').value = '';
    document.getElementById('placeholders-container').innerHTML = '';
    document.getElementById('locale-buttons').innerHTML = '';
    document.getElementById('html-source-preview').value = '';
    document.getElementById('html-preview').innerHTML = '';
    document.getElementById('filename').textContent = 'template';
}


// Initialize with Settings tab
showTab('settings-tab');

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('loadFileInput');

// Add event listeners for drag & drop functionality
dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragover');

    const files = event.dataTransfer.files;
    if (files.length) {
        fileInput.files = files;
        loadTemplate();
    }
});

// This allows users to click on the drop zone to open the file selector
dropZone.addEventListener('click', () => {
    fileInput.click();
});


document.getElementById('email-template').addEventListener('input', () => {
    templateSaved = false;
    templateLoaded = false;
});


window.addEventListener('beforeunload', (event) => {
    if (!templateSaved && !templateLoaded) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
});

document.addEventListener("DOMContentLoaded", function() {
    // New Template button
    document.getElementById("createNewTemplate").addEventListener("click", createNewTemplate);

    // File input
    document.getElementById("loadFileInput").addEventListener("change", loadTemplate);

    // Save button
    document.getElementById("saveTemplateToLocal").addEventListener("click", saveTemplateToLocal);

    // Tabs
    document.getElementById("settings-tab-btn").addEventListener("click", function() {
        showTab('settings-tab');
    });

    document.getElementById("preview-tab-btn").addEventListener("click", function() {
        showTab('preview-tab');
    });

    // Add new Placeholder button
    document.getElementById("addNewPlaceholder").addEventListener("click", addNewPlaceholder);

    // Add new Locale button
    document.getElementById("addNewLocale").addEventListener("click", addNewLocale);
});
