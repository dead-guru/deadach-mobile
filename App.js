import 'react-native-gesture-handler';
import {enableScreens} from 'react-native-screens';
import {
    ActivityIndicator,
    Alert,
    Button,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    SectionList,
    StyleSheet,
    Text,
    TextInput,
    TouchableHighlight,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import * as Linking from 'expo-linking';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {DarkTheme, DefaultTheme, NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useHeaderHeight} from '@react-navigation/elements'
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import {createStackNavigator} from '@react-navigation/stack';
import he from 'he'
import Hyperlink from 'react-native-hyperlink'
import ImageView from 'react-native-image-viewing'

import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';

import * as mime from 'mime';

import styles from './styles';

import {getBoardThreadFromApi, getBoardThreadsWithBody, getBoarsFromApi, postViaApi} from './providers/deadach';

enableScreens();
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
    const scheme = useColorScheme();
    return (
        <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack.Navigator
                initialRouteName="Home"
            >
                <Stack.Screen name="Home" animationTypeForReplace="pop" headerBackTitle="Back" component={Home} options={{headerShown: false}} />
                <Stack.Screen name="Form" animationTypeForReplace="pop" headerBackTitle="Back" component={PostForm}
                              options={{
                                  headerBackTitle: "Back",
                              }}
                />
                <Stack.Screen name="Thread" component={ThreadScreen} options={{
                    headerBackTitle: "Back",
                    headerShown: true
                }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const getCaptcha = () => {
    const captchaExtra = 'abcdefghijklmnopqrstuvwxyz1234567890';

    return fetch('https://4.dead.guru/inc/captcha/entrypoint.php?mode=get&raw=1&extra=' + captchaExtra)
        .then(response => response.json())
        .then(json => {
            return json;
        })
        .catch(error => {
            console.error(error);
        });

    //
}

function PostForm({route, navigation}) {
    const {board, thread} = route.params;
    const [images, setImages] = useState([]);
    const [isDisabled, setIsDisabled] = useState(false);
    const [isDisabledPost, setIsDisabledPost] = useState(false);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [captchaText, setCaptchaText] = useState('');

    const [captchaCookie, setCaptchaCookie] = useState('');
    const [captchaImage, setCaptchaImage] = useState('https://4.dead.guru/static/clickme.gif');

    const [post, setPost] = useState({
        board: board,
        thread: null,
        subject: null,
        body: '',
        files: [],
        captchaText: '',
        captchaCookie: ''
    });

    let title = 'Post for /' + board + '/';
    if (thread !== null) {
        title = 'Comment for /' + board + '/ #' + thread;
        post.thread = thread;
    }

    useEffect(() => {
        navigation.setOptions({
            title: title
        });
        post.thread = thread;
        post.board = board;
        setPost(post);
    }, [board, thread]);

    useEffect(() => {
        post.subject = subject;
        setPost(post);
    }, [subject])
    useEffect(() => {
        post.body = body;
        setPost(post);
    }, [body])
    useEffect(() => {
        post.captchaText = captchaText;
        setPost(post);
    }, [captchaText])
    useEffect(() => {
        post.captchaCookie = captchaCookie;
        setPost(post);
    }, [captchaCookie])

    const postHandle = async (post) => {
        setIsDisabledPost(true);
        let error = false;

        //validation
        if (post.body.length < 3) {
            Alert.alert('Error', 'Post too short');
            error = true;
        }

        //validation
        if (!error && post.files.length < 1 && thread <= 0) {
            Alert.alert('Error', 'Post must have at least one image!');
            error = true;
        }

        if (!error) {
            let res = await postViaApi(post)

            if ('error' in res) {
                Alert.alert('Api Error!', res.error.replace(/<[^>]+>/g, ' '))
                setIsDisabledPost(false);
                return;
            }

            setIsDisabledPost(false);
            navigation.replace('Home', {
                screen: 'Board',
                params: {
                    rf: Math.random(),
                    board: board
                }
            })
            navigation.navigate('Thread', {
                board: board,
                rf: Math.random(),
                thread: post.thread === null ? res.id : post.thread
            });
        } else {
            setIsDisabledPost(false);
        }

    }

    const pickImage = async () => {
        setIsDisabled(true);
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsMultipleSelection: true,
            selectionLimit: 3
        });

        if (!result.canceled) {

            if (result.assets.length > 3) {
                Alert.alert('Error', 'Only 3 files available per post!');
                return;
            }

            let imgs = [];
            for (const im in result.assets) {
                let uri = result.assets[im].uri;
                const fileInfo = await FileSystem.getInfoAsync(uri);
                let filename = uri.split('/').pop();
                const maxFilesize = 200000;
                if (fileInfo > maxFilesize) {
                    Alert.alert('Error!', 'File too big! Max: ' + maxFilesize)
                }

                const mimeType = mime.getType(filename);

                if (result.assets[im].type === 'video') { // generate video previews
                    const turi = await VideoThumbnails.getThumbnailAsync(
                        uri,
                        {
                            time: 100,
                        }
                    );

                    uri = turi.uri;
                }

                imgs.push({
                    preview: uri,
                    uri: result.assets[im].uri,
                    type: result.assets[im].type,
                    filename: filename,
                    mime: mimeType
                })
            }
            setIsDisabled(false);
            setImages(imgs);
        } else {
            setIsDisabled(false);
        }
    };

    useEffect(() => {
        post.files = images;
        setPost(post);
    }, [images])

    const generateCaptcha = () => {
        getCaptcha().then(
            (resp) => {
                setCaptchaCookie(resp.cookie)
                setCaptchaImage('data:image/png;base64,' + resp.image)
            }
        )
    }

    const height = useHeaderHeight()

    return (
        <SafeAreaView style={{
            marginHorizontal: 20,
            height: "100%",
        }}>
            <KeyboardAvoidingView style={{
                flex: 1,
                flexDirection: 'column',
                justifyContent: 'center',
            }} behavior={Platform.select({
                android: undefined,
                ios: 'padding'
            })} enabled keyboardVerticalOffset={height + 47}>
                <ScrollView style={{width: "100%"}}>
                    {thread === null ? <View
                        style={{
                            backgroundColor: '#fff',
                            borderBottomColor: '#000000',
                            borderBottomWidth: 1,
                            marginBottom: 0,
                            marginTop: 10
                        }}>
                        <TextInput
                            clearButtonMode={'while-editing'}
                            editable
                            numberOfLines={1}
                            placeholderTextColor="#6B6B6B"
                            maxLength={40}
                            value={subject}
                            onChangeText={setSubject}
                            placeholder={"Subject"}
                            style={{padding: 10, backgroundColor: '#131313', color: '#ffffff', borderWidth: 1,}}
                        /></View> : null}
                    <View style={{backgroundColor: '#333333', marginVertical: 10}}>
                        <Button
                            style={{color: '#fff'}}
                            title={isDisabled ? "Loading..." : "Add files"}
                            disabled={isDisabled}
                            onPress={pickImage}
                        />
                    </View>
                    {selectedImagesPreview(images)}
                    <View
                        style={{
                            backgroundColor: '#fff',
                            borderBottomColor: '#000000',
                            borderBottomWidth: 1,
                            marginBottom: 15,
                        }}>
                        <TextInput
                            autoFocus={thread !== null}
                            editable
                            multiline
                            numberOfLines={10}
                            maxLength={15000}
                            value={body}
                            placeholderTextColor="#6B6B6B"
                            onChangeText={setBody}
                            placeholder={"Post"}
                            style={{
                                padding: 10,
                                height: 300,
                                backgroundColor: '#131313', color: '#ffffff', borderWidth: 1,
                            }}
                        /></View>
                    {thread === null ?
                        <View>
                            <TouchableHighlight onPress={generateCaptcha}>
                                <View>
                                    <Text style={{color: '#6B6B6B'}}>Click on image to reload captcha</Text>
                                    <Image style={{
                                        width: 250,
                                        height: 80,
                                    }} source={{uri: captchaImage}} />
                                </View>
                            </TouchableHighlight>
                            <View
                                style={{
                                    backgroundColor: '#fff',
                                    borderBottomColor: '#000000',
                                    borderBottomWidth: 1,
                                    marginBottom: 0,
                                    marginTop: 10
                                }}>
                                <TextInput
                                    clearButtonMode={'while-editing'}
                                    editable
                                    numberOfLines={1}
                                    placeholderTextColor="#6B6B6B"
                                    maxLength={6}
                                    value={captchaText}
                                    onChangeText={setCaptchaText}
                                    placeholder={"Captcha"}
                                    style={{padding: 10, backgroundColor: '#131313', color: '#ffffff', borderWidth: 1,}}
                                /></View>
                        </View>
                        : null}
                    <View style={{backgroundColor: '#313131'}}>
                        <Button
                            style={{color: '#fff', fontWeight: 'bold'}}
                            color={'#ff7920'}
                            title={isDisabledPost ? "Posting..." : "Create"}
                            disabled={isDisabledPost}
                            onPress={() => {
                                postHandle(post)
                            }
                            }
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function selectedImagesPreview(images) {
    let is = [];
    for (const i in images) {

        let preview = <Image source={{uri: images[i].preview}} style={{
            width: 100,
            height: 100,
            resizeMode: 'cover',
        }} />

        if (images[i].type === 'video') {
            preview = <View style={{
                borderRadius: 5,
                borderWidth: 1,
                borderColor: '#ffffff',
                borderStyle: 'dotted'
            }}>
                <Ionicons name="videocam-outline" color="#ffffff" size={25} style={{
                    position: 'absolute',
                    top: 2,
                    left: 5,
                    zIndex: 999
                }} />
                {preview}
            </View>
        }
        is.push(<View style={{marginRight: 5}}>{preview}</View>)
    }

    return is.length > 0 ? <View style={{flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10}}>{is}</View> : null
}

function Home({navigation}) {
    return (
        <Tab.Navigator
            initialRouteName="List"
            screenOptions={({route}) => ({
                headerRight: () => (
                    route.name === 'Board' ?
                        <TouchableHighlight onPress={() => {
                            navigation.navigate('Form', {
                                board: typeof route.params === 'object' && 'board' in route.params ? route.params.board : null,
                                thread: typeof route.params === 'object' && 'thread' in route.params ? route.params.thread : null,
                            })
                        }}>
                            <View style={{paddingRight: 10}}>
                                <Ionicons name='create' size={24} color='#FF7920' />
                            </View>
                        </TouchableHighlight> : null
                ),
                tabBarIcon: ({focused, color, size}) => {
                    let iconName;

                    if (route.name === 'List') {
                        iconName = focused ? 'ios-list' : 'ios-list-outline';
                    } else if (route.name === 'Board') {
                        iconName = focused ? 'document-text' : 'document-text-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: 'tomato',
                tabBarInactiveTintColor: 'gray',
            })}>
            <Tab.Screen name="Board" component={BoardScreen} listeners={() => ({
                tabPress: () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                },
            })} />
            <Tab.Screen name="List" component={BoardsScreen} listeners={() => ({
                tabPress: () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                },
            })} />
        </Tab.Navigator>
    );
}

function BoardsScreen({navigation}) {
    const [apiResponse, setApiResponse] = useState([]);

    useMemo(() => {
        let ss = [];
        getBoarsFromApi().then((res) => {
            for (const [key, boards] of Object.entries(res)) {
                let b = [];
                for (const [board, title] of Object.entries(boards)) {
                    b.push({title: title, link: '/' + board + '/', board: board})
                }
                ss.push({title: key, data: b});
            }
            setApiResponse(ss);
        });
    }, [])

    return (
        <View style={styles.container}>
            <SectionList
                contentContainerStyle={{paddingBottom: 100}}
                sections={apiResponse}
                renderItem={({item}) => <TouchableOpacity
                    onPress={() => navigation.replace('Home', {
                        screen: 'Board',
                        params: {
                            board: item.board
                        }
                    })}
                ><Text style={styles.item}>{item.title.replace(/<[^>]+>/g, '')}</Text></TouchableOpacity>}
                renderSectionHeader={({section}) => (
                    <Text style={styles.sectionHeader}>{section.title.replace(/<[^>]+>/g, '')}</Text>
                )}
                keyExtractor={item => `basicListEntry-${item.board}`}
            />
        </View>
    );

}

function BoardScreen({route, navigation}) {
    // const [board, setBoard] = useState();
    let board;
    if (typeof route.params === 'object' && 'board' in route.params) {
        // setBoard(route.params.board);
        board = route.params.board;
    } else {
        return (
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <Text style={{color: '#848484'}}>Please, select board first!</Text>
            </View>
        );
    }

    const {rf} = route.params;

    const [refreshing, setRefreshing] = useState(false);
    // const [loading, setLoading] = useState(false);
    const [p, setP] = useState(0);
    const [apiResponse, setApiResponse] = useState([]);

    const getData = (page, board) => {
        setP(page)
        setRefreshing(true);
        let oldApiResponse = apiResponse;
        if (page === 0) { //TODO: cant reset state to initial...
            oldApiResponse = [];
        }
        getBoardThreadsWithBody(board, page).then((res) => {
            if (res.length === 0 && page > 0) {
                return false;
            }
            setApiResponse([...oldApiResponse, ...res]);
        }).catch(error => {
            console.error(error);
        }).finally(() => {
            setRefreshing(false);
        });

        return true;
    }

    useMemo(() => {
        getData(0, board);
    }, [board, rf]);

    let onEndReachedCalledDuringMomentum = false;

    return (
        <View style={styles.container}>
            <FlatList
                contentContainerStyle={{paddingBottom: 100}}
                style={{width: '100%'}}
                initialNumToRender={7}
                showsVerticalScrollIndicator={false}
                data={apiResponse}
                onMomentumScrollBegin={() => {
                    onEndReachedCalledDuringMomentum = false;
                }}
                onEndReached={() => {
                    if (!onEndReachedCalledDuringMomentum && !refreshing) {
                        getData(p + 1, board);
                        onEndReachedCalledDuringMomentum = true;
                    }
                }}
                onEndReachedThreshold={0.05}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => {
                        getData(0, board);
                    }} />
                }
                ListFooterComponent={
                    <View style={{height: 160, justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={{color: '#848484'}}>This is the end...</Text>
                        {refreshing ? <ActivityIndicator /> : null}
                    </View>
                }
                keyExtractor={(item) => (`thread-${item.no}`)}
                renderItem={({item}) =>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Thread', {
                            board: board,
                            thread: item.no
                        })}
                    ><View style={{flexDirection: 'column', flexWrap: 'wrap', width: '100%'}}>
                        <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
                            <Text style={styles.threadId}>#{item.no}</Text>
                            <Text style={styles.threadName}>{item.name}: </Text>
                            <Text style={styles.threadSub}>{item.sub}</Text>
                        </View>
                        {processFiles(board, item, false)}
                        {processEmbed(board, item, false)}
                        {'com' in item ? <View style={{maxHeight: 150}}>
                            <Text key={"post_text_" + item.no.toString()} style={[styles.threadCom]}>{formatCom(item.com)}</Text>
                        </View> : null}

                    </View>
                        <View
                            style={{
                                width: '100%',
                                borderBottomColor: '#4f4f4f',
                                borderBottomWidth: StyleSheet.hairlineWidth,
                            }}
                        />
                    </TouchableOpacity>

                }
            />
            <SafeAreaView forceInset={{bottom: 'never'}} />
        </View>
    );
}

function ThreadScreen({route, navigation}) {
    const {board, thread, rf} = route.params;

    const [apiResponse, setApiResponse] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const [currentImageIndex, setImageIndex] = useState(0);
    const [images, setImages] = useState([]);
    const [isVisible, setIsVisible] = useState(false);

    const flatlistRef = useRef()

    const onSelect = (images, index) => {
        setImageIndex(index);
        setImages(images);
        setIsVisible(true);
    };

    const onRequestClose = () => setIsVisible(false);

    const onLongPress = (image) => {
        handleLinkPress(image.uri);
    };

    const [indexMap, setIndexMap] = useState([]); //using for smth like scrollTo(<postId>) looks like shit

    const getData = () => {
        // setRefreshing(true);
        getBoardThreadFromApi(board, thread).then((res) => {
            setIndexMap([])
            for (const post in res) {
                let images = [];
                indexMap.push(res[post].no);
                if ('tim' in res[post] && !['.webm', '.mp4'].includes(res[post].ext)) {
                    images.push({
                        name: res[post].filename,
                        uri: 'https://4.dead.guru/' + board + '/src/' + res[post].tim + res[post].ext
                    });
                }
                if ('extra_files' in res[post]) {
                    for (const ex_file in res[post].extra_files) {
                        if (!['.webm', '.mp4'].includes(res[post].extra_files[ex_file].ext)) {
                            images.push({
                                name: res[post].extra_files[ex_file].filename,
                                uri: 'https://4.dead.guru/' + board + '/src/' + res[post].extra_files[ex_file].tim + res[post].extra_files[ex_file].ext
                            });
                        }
                    }

                }
                res[post].images = images;
            }
            navigation.setOptions({ //TODO: full of shit
                title: '/' + board + '/ #' + thread,
                headerRight: () => {
                    return <TouchableHighlight onPress={() => {
                        navigation.navigate('Form', {board: board, thread: thread})
                    }}>
                        <View style={{paddingRight: 10}}>
                            <Ionicons name='create' size={24} color='#FF7920' />
                        </View>
                    </TouchableHighlight>
                }
            })
            setIndexMap(indexMap)
            setApiResponse(res);
        }).catch(error => {
            console.error(error);
        }).finally(() => {
            setRefreshing(false);
        });
    };
    useEffect(() => {
        getData();
    }, [board, thread, refreshing, rf]);

    useEffect(() => {
        typeof flatlistRef !== 'undefined' ? flatlistRef.current.scrollToEnd({
            animated: true,
        }) : console.log(flatlistRef)
    }, [rf])

    return (
        <View style={styles.container}>
            <ImageView
                images={images}
                imageIndex={currentImageIndex}
                presentationStyle="overFullScreen"
                visible={isVisible}
                onRequestClose={onRequestClose}
                onLongPress={onLongPress}
            />
            <FlatList
                ref={flatlistRef}
                data={apiResponse}
                contentContainerStyle={{paddingBottom: 20}}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={getData} />
                }
                keyExtractor={(item) => `post-${item.no}`}
                ListFooterComponent={
                    <View>
                        <TouchableHighlight onPress={() => {
                            setRefreshing(true);
                            getData();
                        }}>
                            <View style={{height: 160, justifyContent: 'center', alignItems: 'center'}}>
                                <Text style={{color: '#848484'}}>This is the end...</Text>
                                <View style={{
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    alignSelf: 'center', marginTop: 10, justifyContent: 'center', alignItems: 'center'
                                }}>
                                    <Ionicons name='refresh' size={18} color='#53738e' />
                                    <Text style={{color: '#53738e'}}> Check updates</Text>
                                </View>
                            </View></TouchableHighlight>
                        {refreshing ? <ActivityIndicator /> : null}
                    </View>
                }
                renderItem={({item, index}) =>
                    <View style={{
                        flexDirection: 'column',
                        flexWrap: 'wrap',
                        width: '100%'
                    }}>
                        <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
                            <Text style={styles.threadId}>#{item.no}</Text>
                            <Text style={styles.threadName}>{item.name}: </Text>
                            <Text style={styles.threadSub}>{item.sub}</Text>
                        </View>

                        {processFiles(board, item, true, onSelect)}
                        {processEmbed(board, item, true)}
                        {'com' in item ? processCom(item.com, flatlistRef, indexMap) : null}
                        <View
                            style={{
                                width: '100%',
                                borderBottomColor: '#4f4f4f',
                                borderBottomWidth: StyleSheet.hairlineWidth,
                            }}
                        />
                    </View>}
            />
            <SafeAreaView forceInset={{bottom: 'never'}} />
        </View>
    );
}

const processCom = (com, flatListRef, indexMap) => {
    if (com.length > 500) {
        //TODO: Post too long click to expand
    }

    return <View style={{maxHeight: 9000}}>
        <Hyperlink linkStyle={{color: '#ff7920'}} onPress={(url, text) => handleLinkPress(url)}>
            <Text style={[styles.threadCom]}>{formatCom(com, flatListRef, indexMap)}</Text>
        </Hyperlink>
    </View>
}

const processEmbed = (board, item, clickable) => {
    if ('embed' in item) {
        if (detectYoutube(item.embed)) { //TODO: vimeo, vocaro
            let image = <Image
                style={styles.postImage}
                source={{
                    uri: 'https://img.youtube.com/vi/' + detectYoutube(item.embed) + '/0.jpg',
                }}
            />

            if (clickable) {
                image = <TouchableOpacity
                    onPress={() => handleLinkPress('https://www.youtube.com/watch?v=' + detectYoutube(item.embed))}
                >{image}</TouchableOpacity>
            }

            return image
        }
    }

    return null;
}

const processFiles = (board, item, clickable, onSelect) => {
    let image = [];
    if ('tim' in item) {
        let files = [];
        files.push({filename: item.tim, extension: item.ext, original: item.filename})

        if ('extra_files' in item) {
            for (const f in item.extra_files) {
                files.push({
                    filename: item.extra_files[f].tim,
                    extension: item.extra_files[f].ext,
                    original: item.extra_files[f].filename
                })
            }
        }

        let firstImage = null;
        let imagesCount = 0;
        for (const file in files.reverse()) { //TODO: Reverse issue!
            if (!['.webm', '.mp4'].includes(files[file].extension)) {
                firstImage = files[file];
                imagesCount++;
            }
        }

        if (firstImage !== null) {
            image.push(
                <Image
                    style={styles.postImage}
                    key={'post_image_' + item.no.toString()}
                    source={{
                        uri: 'https://4.dead.guru/' + board + '/thumb/' + firstImage.filename + '.png',
                    }}
                />)

            if (clickable) {
                image = [<TouchableOpacity
                    key={'post_image_c_' + item.no.toString()}
                    onPress={() => onSelect(item.images, 0)}
                >{image[0]}</TouchableOpacity>,
                    <View key={'post_image_meta_' + item.no.toString()} style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        alignSelf: 'flex-start',
                    }}><Text key={'post_image_p_' + item.no.toString()} style={[styles.threadImagesCount]}>1/{imagesCount}</Text>
                        <Text key={'post_image_t_' + item.no.toString()} style={[styles.threadImagesName]}>{firstImage.original}{firstImage.extension}</Text></View>]
            }
        }

        for (const file in files) {//Only for video
            if (!['.webm', '.mp4'].includes(files[file].extension)) {
                continue;
            }

            image.push(<TouchableOpacity
                onPress={() => handleLinkPress('https://4.dead.guru/' + board + '/src/' + files[file].filename + files[file].extension)}
            ><View style={styles.threadFile}>
                <Ionicons name='cloud-download-outline' size={24} color='#FFF' />
                <Text style={{fontSize: 16, color: '#c1c1c1'}}> {files[file].filename}{files[file].extension}</Text>
            </View></TouchableOpacity>)
        }
    }

    return image.length > 0 ? image : null;
}

const handleLinkPress = async (url) => {
    const supported = await Linking.canOpenURL(url);

    if (supported) {
        Linking.openURL(url);
    } else {
        Alert.alert(`Don't know how to open this URL: ${url}`);
    }
};

function detectYoutube(str) {
    const regex = /data-video="([a-zA-Z0-9\-_]{10,11})"/gm;

    let m;
    let res = [];

    while ((m = regex.exec(str)) !== null) {
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        m.forEach((match, groupIndex) => {
            res.push(match)
        });
    }

    return res.length > 0 ? res[1] : false;
}

const HASHTAG_FORMATTER = (string, listRef, indexMap) => {
    return string.split(/(>>[0-9]*)\s/gi).filter(Boolean).map((v, i) => {
        if (v.includes('>>')) {
            const postId = parseInt(v.replace(' ', '').replace('>>', ''));
            return <TouchableOpacity
                onPress={() => indexMap.indexOf(postId) > -1 && typeof listRef !== 'undefined' ? listRef.current.scrollToIndex({
                    animated: true,
                    index: indexMap.indexOf(postId),
                    viewOffset: 20,
                }) : console.log(listRef)}
            ><Text style={{color: '#ff7920', fontWeight: 'bold'}}>{v.replace(' ', '')}</Text></TouchableOpacity>
        } else {
            return <Text>{v}</Text>
        }
    })
};

const formatCom = (com, listRef, indexMap) => {
    // return com.replaceAll('<br/>', "\n")
    return HASHTAG_FORMATTER(he.decode(com.replaceAll('<br/>', "\n").replace(/<[^>]+>/g, ' ')), listRef, indexMap);
}
