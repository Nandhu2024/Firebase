let editingId = null;

// Fetch posts from Firebase on page load
window.onload = function () {
    renderTable();
}

const addBtn = document.getElementById('addBtn');
const formContainer = document.getElementById('formContainer');
const postForm = document.getElementById('postForm');
const cancelBtn = document.getElementById('cancelBtn');
const tableBody = document.getElementById('tableBody');
const postIdInput = document.getElementById('postId');
const postContentInput = document.getElementById('postContent');
const formTitle = document.getElementById('formTitle');

addBtn.addEventListener('click', showAddForm);
cancelBtn.addEventListener('click', hideForm);
postForm.addEventListener('submit', handleSubmit);

function showAddForm() {
    editingId = null;  // Reset editing ID
    formTitle.textContent = 'Add New Post';
    postIdInput.disabled = false; // Changing id input is prohibited during editing
    postIdInput.value = '';
    postContentInput.value = '';
    formContainer.style.display = 'block';
    postIdInput.focus();
}

function showEditForm(id) {
    editingId = id;
    // Find post in Firebase
    const firebaseUrl = 'https://student-5f7ff-default-rtdb.asia-southeast1.firebasedatabase.app/posts.json';
    axios.get(firebaseUrl)
        .then(function (response) {
            const data = response.data;
            let foundKey = null;
            let foundPost = null;
            for (const key in data) {
                if (data[key].id == id) {
                    foundKey = key;
                    foundPost = data[key];
                    break;
                }
            }
            if (foundPost) {
                formTitle.textContent = 'Edit Post';
                postIdInput.value = foundPost.id;
                postIdInput.disabled = true;
                postContentInput.value = foundPost.content;
                formContainer.style.display = 'block';
                postContentInput.focus();
                postForm.setAttribute('data-firebase-key', foundKey);
            }
        });
}

function hideForm() {
    formContainer.style.display = 'none'; //form is hidden unless user clicks "Add Details"
    editingId = null;
}

function handleSubmit(e) {
    e.preventDefault();

    const id = parseInt(postIdInput.value);
    const content = postContentInput.value.trim();

    if (!content) {
        alert('Please enter post content');
        return;
    }


    if (editingId === null) {
        // Check for unique ID in Firebase
        const firebaseUrl = 'https://student-5f7ff-default-rtdb.asia-southeast1.firebasedatabase.app/posts.json';
        axios.get(firebaseUrl)
            .then(function (response) {
                const data = response.data;
                let idExists = false;
                if (data) {
                    Object.values(data).forEach(function (post) {
                        if (post.id == id) idExists = true;
                    });
                }
                if (idExists) {
                    alert('ID already exists. Please use a unique ID.');
                    return;
                }
                // Add to Firebase
                axios.post(firebaseUrl, { id: id, content: content })
                    .then(function (response) {
                        alert('Post added to Firebase!');
                        renderTable();
                        hideForm();
                    })
                    .catch(function (error) {
                        alert('Error adding post to Firebase: ' + error);
                    });
            });
    } else {
        // Edit in Firebase using key
        const keyToEdit = postForm.getAttribute('data-firebase-key');
        if (keyToEdit) {
            const editUrl = `https://student-5f7ff-default-rtdb.asia-southeast1.firebasedatabase.app/posts/${keyToEdit}.json`;
            axios.patch(editUrl, { content: content })
                .then(function () {
                    alert('Post updated in Firebase!');
                    renderTable();
                    hideForm();
                })
                .catch(function (error) {
                    alert('Error updating post in Firebase: ' + error);
                });
        } else {
            alert('Error: Firebase key not found for this post.');
        }
    }
}

function deletePost(id) {
    const confirmDelete = confirm('Delete this post?');
    if (!confirmDelete) return;
    // id is now firebaseKey
    const deleteUrl = `https://student-5f7ff-default-rtdb.asia-southeast1.firebasedatabase.app/posts/${id}.json`;
    axios.delete(deleteUrl)
        .then(function () {
            alert('Post deleted from Firebase!');
            renderTable();
        })
        .catch(function (error) {
            alert('Error deleting post from Firebase: ' + error);
        });
}

function renderTable() {
    const firebaseUrl = 'https://student-5f7ff-default-rtdb.asia-southeast1.firebasedatabase.app/posts.json';
    axios.get(firebaseUrl)
        .then(function (response) {
            const data = response.data;
            if (!data) {
                tableBody.innerHTML = '<tr><td colspan="3">No posts available. Click "Add Details" to create your first post!</td></tr>';
                return;
            }
            // Convert to array and sort by id
            const postsArr = Object.entries(data).map(([key, post]) => ({ id: post.id, content: post.content, firebaseKey: key }));
            postsArr.sort((a, b) => a.id - b.id);
            const rows = postsArr.map(post => `
                <tr>
                    <td>${post.id}</td>
                    <td>${post.content}</td>
                    <td>
                        <button onclick="showEditForm(${post.id}, '${post.firebaseKey}')">Edit</button>
                        <button onclick="deletePost('${post.firebaseKey}')">Delete</button>
                    </td>
                </tr>
            `);
            tableBody.innerHTML = rows.join('');
        })
        .catch(function (error) {
            tableBody.innerHTML = '<tr><td colspan="3">Error loading posts.</td></tr>';
        });
}