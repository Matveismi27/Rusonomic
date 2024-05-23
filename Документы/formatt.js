function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    socket.emit('login', { username, password }, (response) => {
        if (response.success) {
            alert('Login successful!');
        } else {
            alert('Login failed!');
        }
    });
}
