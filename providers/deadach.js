const HOST = 'https://deada.ch';

export function getBoardThreadsFromApi(board) {
    return fetch(HOST + '/' + board + '/threads.json' + '?random_number=' + new Date().getTime())
        .then(response => response.json())
        .then(json => {
            return json[0]['threads'];
        })
        .catch(error => {
            console.error(error);
        });
}

export function getBoardThreadFromApi(board, thread) {
    return fetch(HOST + '/' + board + '/res/' + thread + '.json' + '?random_number=' + new Date().getTime())
        .then(response => response.json())
        .then(json => {
            return json['posts'];
        })
        .catch(error => {
            console.error(error);
        });
}

export function getBoarsFromApi() {
    return fetch(HOST + '/boards.php')
        .then(response => response.json())
        .then(json => {
            return json;
        })
        .catch(error => {
            console.error(error);
        });
}

export function getBoardThreadsWithBody(board, page) {
    if (typeof page === 'undefined' || page === null) {
        page = '0'
    }

    let uri = HOST + '/' + board + '/threads.json' + '?random_number=' + new Date().getTime();

    return new Promise((resolve, reject) => {
        fetch(uri)
            .then(response => response.json())
            .then(async json => {
                let threads = [];
                if (typeof json[page] === 'undefined') {
                    resolve([]); //TODO: Must STOP
                }
                for (const thread of json[page]['threads']) {
                    await getBoardThreadFromApi(board, thread.no).then((th) => {
                        threads.push(th[0]);
                    }).catch(error => {
                        console.error(error);
                    });
                }
                resolve(threads);
            })
            .catch(error => {
                reject(error);
            });
    });
}

export async function postViaApi(post) {
    let formData = new FormData();
    formData.append('api', 'GCOnnUXiyNg18isqP8xqiRTPB7kYrsBReN_rXgA')
    formData.append('json_response', '1')
    formData.append('post', 'Створити')

    let fi = 1;

    Object.keys(post).forEach(function (key, index) {
        if (post[key] !== null && !(Array.isArray(post[key]) && post[key].length === 0)) {
            let val;
            if (key === 'files') {
                for (const file in post.files) {
                    val = {
                        uri: post.files[file].uri,
                        name: post.files[file].filename,
                        type: post.files[file].mime
                    }
                    key = 'file' + (fi > 1 ? fi : '');
                    formData.append(key, val);
                    fi++;
                }
            } else if (key === 'captchaText') {
                formData.append('captcha_text', post[key]);
            } else if (key === 'captchaCookie') {
                formData.append('captcha_cookie', post[key]);
            } else {
                formData.append(key, post[key]);
            }
        }
    });

    const requestOptions = {
        method: 'POST',
        headers: {'Content-Type': 'multipart/form-data', 'Accept': '*/*'},
        body: formData
    };

    return await fetch(
        HOST + '/post/', requestOptions)
        .then(async response => {
            let resp = await response.text();
            try {
                return JSON.parse(resp)
            } catch (e) {
                return {'error': 'Parse JSON error =('};
            }
        }).catch(e => {
            return {'error': e.toString().replace(/<[^>]+>/g, ' ')};
        });
}

export async function getCaptcha() {
    const captchaExtra = 'abcdefghijklmnopqrstuvwxyz1234567890';

    return fetch(HOST + '/inc/captcha/entrypoint.php?mode=get&raw=1&extra=' + captchaExtra)
        .then(response => response.json())
        .then(json => {
            return json;
        })
        .catch(error => {
            console.error(error);
        });

    //
}

export async function getLatest() {
    return fetch(HOST + '/recent.json' + '?random_number=' + new Date().getTime())
        .then(response => response.json())
        .then(json => {
            return json;
        })
        .catch(error => {
            console.error(error);
            return [];
        });
}
