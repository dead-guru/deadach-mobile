import AsyncStorage from "@react-native-async-storage/async-storage";

export function blockPost(board, thread, postId) {
    return new Promise(async (resolve, reject) => {
        let blocked = await AsyncStorage.getItem('@blocked_posts_' + board);

        if (blocked === null) {
            blocked = '[]';
        }

        blocked = JSON.parse(blocked);

        blocked.push('post:' + board + '|' + thread + '|' + postId);

        await AsyncStorage.setItem('@blocked_posts_' + board, JSON.stringify(blocked));

        resolve(blocked);
    });
}

export async function isPostBlocked(board, thread, postId) {
    let blocked = await AsyncStorage.getItem('@blocked_posts_' + board);

    if (blocked === null) {
        blocked = '[]';
    }

    blocked = JSON.parse(blocked);

    return blocked.includes('post:' + board + '|' + thread + '|' + postId);
}
