import 'react-native-gesture-handler';
import {enableScreens} from 'react-native-screens';
import {
    ActivityIndicator,
    Alert,
    Button,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    SectionList,
    Text,
    TextInput,
    TouchableHighlight,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import * as Linking from 'expo-linking';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {DarkTheme, DefaultTheme, NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useHeaderHeight} from '@react-navigation/elements'
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import he from 'he'
import Hyperlink from 'react-native-hyperlink'
import ImageView from 'react-native-image-viewing'

import {FlashList} from "@shopify/flash-list"

import reactStringReplace from 'react-string-replace';

import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as Clipboard from 'expo-clipboard';
import {getLocales} from 'expo-localization';

import AsyncStorage from '@react-native-async-storage/async-storage';

import * as mime from 'mime';

import styles from './styles';

import {HoldItem, HoldMenuProvider} from 'react-native-hold-menu';
import {RootSiblingParent} from 'react-native-root-siblings';
import Toast from 'react-native-root-toast';
import {I18n} from 'i18n-js';
import * as Progress from 'react-native-progress';

import {
    getBoardThreadFromApi,
    getBoardThreadsWithBody,
    getBoarsFromApi,
    getCaptcha,
    getLatest,
    postViaApi,
    reportPost
} from './providers/deadach';

enableScreens();
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HOST = 'https://deada.ch';

const separator = () => {
    return <View
        style={styles.separator}
    />
}

const translations = {
    en: {
        List: 'List',
        Board: 'Board',
        End: 'This is the end...',
        Subject: 'Subject',
        Post: 'Post',
        Create: 'Create',
        Captcha: 'Captcha',
        ClickToReload: 'Click on image to reload captcha',
        AddFiles: 'Add Files',
        PostFor: 'Post for',
        CommentFor: 'Comment for',
        Back: 'Back',
        Latest: 'Latest',
        BoardFirst: 'Please, select board first!',
    },
    uk: {
        List: 'Список',
        Board: 'Дошка',
        End: 'Це кінець...',
        Subject: 'Тема',
        Post: 'Пост',
        Create: 'Створити',
        Captcha: 'Капча',
        ClickToReload: 'Натистніть на картинку для оновлення',
        AddFiles: 'Додати файли',
        PostFor: 'Пост в',
        Latest: 'Свіже',
        CommentFor: 'Комментар в',
        Back: 'Назад',
        BoardFirst: 'Спочатку оберіть дошку зі списку!',
    },
};

const i18n = new I18n(translations);

i18n.locale = getLocales()[0].languageCode;
i18n.enableFallback = true;

export default function App() {
    const scheme = useColorScheme();

    return (
        <RootSiblingParent>
            <HoldMenuProvider
                theme="dark"
                iconComponent={Ionicons}
            >
                <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
                    <Stack.Navigator
                        initialRouteName="Home"
                    >
                        <Stack.Screen name="Home" animationTypeForReplace="pop" headerBackTitle={i18n.t('Back')} component={Home} options={{headerShown: false}} />
                        <Stack.Screen name="Form" animationTypeForReplace="pop" headerBackTitle={i18n.t('Back')} component={PostForm}
                                      options={{
                                          headerBackTitle: i18n.t('Back'),
                                      }}
                        />
                        <Stack.Screen name="Thread" component={ThreadScreen} options={{
                            headerBackTitle: i18n.t('Back'),
                            headerShown: true
                        }} />
                    </Stack.Navigator>
                </NavigationContainer></HoldMenuProvider></RootSiblingParent>
    );
}

function PostForm({route, navigation}) {
    const {board, thread, postId} = route.params;
    const [images, setImages] = useState([]);
    const [isDisabled, setIsDisabled] = useState(false);
    const [isDisabledPost, setIsDisabledPost] = useState(false);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState((postId !== null && postId !== 0 && typeof postId !== 'undefined') ? '>>' + postId + ' ' + "\n" : '');
    const [captchaText, setCaptchaText] = useState('');

    const [captchaCookie, setCaptchaCookie] = useState('');
    const [captchaImage, setCaptchaImage] = useState(HOST + '/static/clickme.gif');

    const [post, setPost] = useState({
        board: board,
        thread: null,
        subject: null,
        body: '',
        files: [],
        captchaText: '',
        captchaCookie: ''
    });

    let title = i18n.t('PostFor') + ' /' + board + '/';
    if (thread !== null) {
        title = i18n.t('CommentFor') + ' /' + board + '/ #' + thread;
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
                return false;
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

            return true;
        } else {
            setIsDisabledPost(false);
            return false;
        }
    }

    const pickImage = async () => {
        setIsDisabled(true);
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
        <SafeAreaView style={styles.postForm.container}>
            <KeyboardAvoidingView
                style={styles.postForm.keyboardContainer}
                behavior={Platform.select({
                    android: undefined,
                    ios: 'padding'
                })}
                enabled
                keyboardVerticalOffset={height + 47}
            >
                <ScrollView keyboardShouldPersistTaps={'always'} style={styles.postForm.scrollContainer}>
                    {thread === null ? <View
                        style={styles.postForm.input.subject.container}>
                        <TextInput
                            clearButtonMode={'while-editing'}
                            editable
                            numberOfLines={1}
                            placeholderTextColor="#6B6B6B"
                            maxLength={40}
                            value={subject}
                            onChangeText={setSubject}
                            placeholder={i18n.t('Subject')}
                            style={styles.postForm.input.subject.input}
                        /></View> : null}
                    <View style={styles.postForm.button.files.container}>
                        <Button
                            style={styles.postForm.button.files.button}
                            title={isDisabled ? "Loading..." : i18n.t('AddFiles')}
                            disabled={isDisabled}
                            onPress={pickImage}
                        />
                    </View>
                    {isDisabled ?
                        <Progress.Bar indeterminateAnimationDuration={700} color={'#FF7920'} indeterminate={true} useNativeDriver={true} borderWidth={0} borderRadius={0} width={null} /> : null}
                    {selectedImagesPreview(images)}
                    <View
                        style={styles.postForm.input.post.container}>
                        <TextInput
                            autoFocus={thread !== null}
                            editable
                            multiline
                            numberOfLines={10}
                            maxLength={15000}
                            value={body}
                            placeholderTextColor="#6B6B6B"
                            onChangeText={setBody}
                            placeholder={i18n.t("Post")}
                            style={styles.postForm.input.post.input}
                        /></View>
                    {thread === null ?
                        <View>
                            <TouchableHighlight onPress={generateCaptcha}>
                                <View>
                                    <Text style={styles.postForm.captcha.hintText}>{i18n.t('ClickToReload')}</Text>
                                    <Image style={styles.postForm.captcha.image} source={{uri: captchaImage}} />
                                </View>
                            </TouchableHighlight>
                            <View
                                style={styles.postForm.input.subject.container}>
                                <TextInput
                                    clearButtonMode={'while-editing'}
                                    editable
                                    numberOfLines={1}
                                    placeholderTextColor="#6B6B6B"
                                    maxLength={6}
                                    value={captchaText}
                                    onChangeText={setCaptchaText}
                                    placeholder={i18n.t('Captcha')}
                                    style={styles.postForm.input.subject.input}
                                /></View>
                        </View>
                        : null}
                    <View style={styles.postForm.button.submit.container}>
                        <Button
                            style={styles.postForm.button.submit.button}
                            color={'#ff7920'}
                            title={isDisabledPost ? "Posting..." : i18n.t('Create')}
                            disabled={isDisabledPost}
                            onPress={
                                () => {
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

function Home({navigation}) {
    return (
        <Tab.Navigator
            initialRouteName="List"
            screenOptions={({route}) => ({
                headerShown: route.name !== 'List',
                headerRight: () => (
                    route.name === 'Board' && typeof route.params === "object" && 'board' in route.params ?
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
                    } else if (route.name === 'Latest') {
                        iconName = focused ? 'newspaper' : 'newspaper-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#FF7920',
                tabBarInactiveTintColor: 'gray',
            })}>
            <Tab.Screen name="Board" component={BoardScreen} options={{
                title: i18n.t('Board')
            }} listeners={() => ({
                tabPress: () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                },
            })} />
            <Tab.Screen name="List" options={{
                title: i18n.t('List')
            }} component={BoardsScreen} listeners={() => ({
                tabPress: () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                },
            })} />
            <Tab.Screen name="Latest" options={{
                title: i18n.t('Latest')
            }} component={LatestScreen} listeners={() => ({
                tabPress: () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                },
            })} />
        </Tab.Navigator>
    );
}

function LatestScreen({navigation}) {

    const [apiResponse, setApiResponse] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const getData = () => {
        setRefreshing(true)
        getLatest().then((response) => {
            setApiResponse(response['recent_posts']);
            setRefreshing(false);
        });
    }

    useEffect(() => {
        getData();
    }, []);

    const keyExtractor = (item) => `latest-${item.id}-${item.board}`;

    const renderItem = ({item}) => {
        return <TouchableOpacity
            onPress={() => navigation.navigate('Thread', {
                board: item.board,
                thread: item.thread === null ? item.id : item.thread,
                down: item.id
            })}
        ><View style={[styles.thread, {paddingBottom: 10}]}>
            <View style={styles.threadHead}>
                <Text style={styles.threadAction}>{item.thread === null ? 'Thread' : 'Post'} in </Text>
                <Text style={styles.threadBoard}>/{item.board}/</Text>
                <Text style={styles.threadId}>#{item.id}</Text>
                <Text style={styles.threadName}>{item.name}</Text>
                <Text style={styles.threadSub}>{item.subject}</Text>
            </View>
            {processEmbed(item, false)}
            {'files' in item && item['files'] !== null && item['files'].length > 0 && item['files'][0]['extension'] !== 'webm' && item['files'][0]['extension'] !== 'mp4' ?
                <Image resizeMode={"cover"}
                       style={styles.postImage} source={{uri: HOST + '/' + item['files'][0]['file_path']}} /> : null}
            {'files' in item && item['files'] !== null && item['files'].length > 0 && (item['files'][0]['extension'] === 'webm' || item['files'][0]['extension'] === 'mp4') ?
                <View style={styles.threadFile}>
                    <Ionicons name='cloud-download-outline' size={24} color="#FFFFFF" />
                    <Text style={styles.fileNameText}> {item['files'][0]['file_id']}{item['files'][0]['extension']}</Text>
                </View>
                : null}
            {'body_nomarkup' in item ? <View style={styles.threadComContainer}>
                <Text style={[styles.threadCom]}>{formatCom(item.body_nomarkup)}</Text>
            </View> : null}
        </View>
        </TouchableOpacity>;
    };

    return (
        <View style={styles.container} onLayout={getData}>
            <FlashList
                contentContainerStyle={{paddingBottom: 100}}
                ItemSeparatorComponent={separator}
                estimatedItemSize={150}
                data={apiResponse}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => {
                        getData();
                    }} />
                }
                ListFooterComponent={
                    <View style={styles.footerContainer}>
                        <Text style={styles.footerText}>{i18n.t('End')}</Text>
                        {refreshing ? <ActivityIndicator /> : null}
                    </View>
                }
                keyExtractor={keyExtractor}
                renderItem={renderItem}
            />
            <SafeAreaView forceInset={{bottom: 'never'}} />
        </View>
    );
}

function BoardsScreen({navigation}) {
    const [apiResponse, setApiResponse] = useState([]);

    const [modalVisible, setModalVisible] = useState(false);

    const storeData = async (value) => {
        try {
            await AsyncStorage.setItem('@terms', value)
            console.log("store:" + value)
        } catch (e) {
            Alert.alert('Error', e.toString());
        }
    }

    const getTermsModal = async () => {
        try {
            const value = await AsyncStorage.getItem('@terms')
            console.log(value)
            if (value !== null) {
                setModalVisible(!value)
            } else {
                setModalVisible(true)
            }
        } catch (e) {
            Alert.alert('Error!', e.toString());
        }
    }

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
            getTermsModal();
        });
    }, [])

    return (
        <View style={styles.container}>
            <Text style={styles.headTitleText}>Deadach</Text>
            <SectionList
                contentContainerStyle={{paddingBottom: 100}}
                ListFooterComponent={
                    <View style={styles.footerContainer}>
                        <Text style={styles.footerText}>{i18n.t('End')}</Text>
                    </View>
                }
                sections={apiResponse}
                renderItem={({item}) => <TouchableOpacity
                    onPress={() => navigation.replace('Home', {
                        screen: 'Board',
                        params: {
                            board: item.board
                        }
                    })}
                >
                    <Text style={styles.item}>{item.title.replace(/<[^>]+>/g, '')}</Text>
                </TouchableOpacity>}
                renderSectionHeader={({section}) => (
                    <View style={styles.sectionHeaderContainer}>
                        {/*<Ionicons name='radio-button-off-outline' size={18} color='#FF7920' />*/}
                        <Text style={styles.sectionHeader}> {section.title.replace(/<[^>]+>/g, '')}</Text>
                    </View>

                )}
                keyExtractor={item => `basicListEntry-${item.board}`}
            />
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                    storeData('true'); //TODO: ???
                }}>
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>Agree to terms and user policy!</Text>
                        <Pressable onPress={() => {
                            Linking.openURL('https://deada.ch/rules.html');
                        }}><Text style={styles.modalLinks}>View terms and policy</Text></Pressable>
                        <Pressable
                            style={[styles.button, styles.buttonClose]}
                            onPress={() => {
                                setModalVisible(!modalVisible);
                                storeData('true');
                            }}>
                            <Text style={styles.textStyle}>Accept Terms and Policy</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
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
            <View style={styles.notContainer}>
                <Text style={styles.notText}>{i18n.t('BoardFirst')}</Text>
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

    const MenuItems = [
        {
            text: 'Post Actions', icon: 'copy-outline', isTitle: true, onPress: () => {
            }
        },
        {
            text: 'Reply', icon: 'arrow-redo-outline', onPress: (board, thread) => {
                navigation.navigate('Form', {
                    board: board,
                    thread: thread
                })
            }
        },
        {
            text: 'Copy', icon: 'link-outline', onPress: (board, thread) => {
                Clipboard.setStringAsync(HOST + '/' + board + '/res/' + thread + '.html').then(() => {
                    Toast.show('Copied', {
                        duration: Toast.durations.SHORT,
                        position: Toast.positions.BOTTOM,
                        shadow: false,
                        animation: true,
                        hideOnPress: true,
                        delay: 0,
                    });
                });
            }
        },
    ];

    const keyExtractor = useCallback((item) => {
        return `thread-${item.no}`;
    }, []);

    const renderItem = useCallback(({item}) => {
        return <HoldItem
            containerStyles={{
                paddingBottom: 10
            }}
            items={MenuItems} closeOnTap actionParams={{
            Reply: [board, item.no],
            Copy: [board, item.no]
        }}>
            <TouchableOpacity
                style={{backgroundColor: '#000'}}
                onPress={() => navigation.navigate('Thread', {
                    board: board,
                    thread: item.no
                })}
            ><View style={styles.thread}>
                <View style={styles.threadHead}>
                    <Text style={styles.threadId}>#{item.no}</Text>
                    <Text style={styles.threadName}>{item.name}</Text>
                    <Text style={styles.threadSub}>{item.sub}</Text>
                </View>
                {processFiles(board, item, false)}
                {processEmbed(item, false)}
                {'com_nomarkup' in item ? <View style={styles.threadComContainer}>
                    <Text style={[styles.threadCom]}>{formatCom(item.com_nomarkup)}</Text>
                </View> : null}
            </View>
            </TouchableOpacity>
        </HoldItem>
    }, []);

    return (
        <View style={styles.container}>
            <FlashList
                contentContainerStyle={{paddingBottom: 100}}
                ItemSeparatorComponent={separator}
                estimatedItemSize={200}
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
                    <View style={styles.footerContainer}>
                        <Text style={styles.footerText}>{i18n.t('End')}</Text>
                        {refreshing ? <ActivityIndicator /> : null}
                    </View>
                }
                keyExtractor={keyExtractor}
                renderItem={renderItem}
            />
            <SafeAreaView forceInset={{bottom: 'never'}} />
        </View>
    );
}

function ThreadScreen({route, navigation}) {
    const {board, thread, rf, down} = route.params;

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
        return new Promise((resolve, reject) => {
            getBoardThreadFromApi(board, thread).then((res) => {
                let im = [];
                for (const post in res) {
                    let images = [];
                    im.push(res[post].no);
                    if ('tim' in res[post] && !['.webm', '.mp4'].includes(res[post].ext)) {
                        images.push({
                            name: res[post].filename,
                            uri: HOST + '/' + board + '/src/' + res[post].tim + res[post].ext
                        });
                    }
                    if ('extra_files' in res[post]) {
                        for (const ex_file in res[post].extra_files) {
                            if (!['.webm', '.mp4'].includes(res[post].extra_files[ex_file].ext)) {
                                images.push({
                                    name: res[post].extra_files[ex_file].filename,
                                    uri: HOST + '/' + board + '/src/' + res[post].extra_files[ex_file].tim + res[post].extra_files[ex_file].ext
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
                            <View style={styles.headerActionContainer}>
                                <Ionicons name='create' size={24} color='#FF7920' />
                            </View>
                        </TouchableHighlight>
                    }
                })
                setIndexMap(im);
                setApiResponse(res);
                resolve(im);
            }).catch(error => {
                console.error(error);
                reject(error);
            }).finally(() => {
                setRefreshing(false);
            });
        });
    };
    useEffect(() => {
        getData().then((im) => {
            setTimeout(() => {
                if (rf !== undefined && rf !== null && rf !== 0 && typeof flatlistRef !== 'undefined') {
                    console.log('Scroll to: bottom')
                    flatlistRef.current.scrollToIndex({
                        animated: false,
                        index: im.indexOf(im[im.length - 1]),
                    })
                }

                // console.log("Post: " + down, "Index: " + im.indexOf(down), im)

                if (down !== undefined && down !== null && down !== 0 && typeof flatlistRef !== 'undefined') {
                    console.log('Scroll to: ' + down)
                    flatlistRef.current.scrollToIndex({
                        animated: false,
                        index: im.indexOf(down),
                    })
                }

            }, 600)
        });
    }, [board, thread, refreshing, rf, down]);

    const MenuItems = [
        {
            text: 'Post Actions', icon: 'copy-outline', isTitle: true, onPress: (postId) => {
            }
        },
        {
            text: 'Reply', icon: 'arrow-redo-outline', onPress: (board, thread, postId) => {
                navigation.navigate('Form', {
                    board: board,
                    thread: thread,
                    postId: postId
                })
            }
        },
        {
            text: 'Copy', icon: 'link-outline', onPress: (board, thread, postId) => {
                Clipboard.setStringAsync(HOST + '/' + board + '/res/' + thread + '.html#' + postId).then(() => {
                    Toast.show('Copied', {
                        duration: Toast.durations.SHORT,
                        position: Toast.positions.BOTTOM,
                        shadow: false,
                        animation: true,
                        hideOnPress: true,
                        delay: 0,
                    });
                });
            }
        },
        {
            text: 'Report', isDestructive: true, icon: 'warning-outline', onPress: (board, thread, postId) => {
                reportPost(board, thread, postId).then((res) => {
                    Toast.show('Reported', {
                        duration: Toast.durations.SHORT,
                        position: Toast.positions.BOTTOM,
                        shadow: false,
                        animation: true,
                        hideOnPress: true,
                        delay: 0,
                    });
                });
            }
        },
    ];

    const keyExtractor = useCallback((item) => {
        return `post-${item.no}`;
    }, []);

    const renderItem = ({item, index}) => {
        return <HoldItem
            containerStyles={{
                paddingBottom: 5,
                backgroundColor: '#000000'
            }}
            menuAnchorPosition="top-center"
            items={MenuItems} closeOnTap actionParams={{
            Reply: [board, thread, item.no],
            Copy: [board, thread, item.no],
            Report: [board, thread, item.no],
        }}>
            <View style={{backgroundColor: '#000'}}>
                <View style={[styles.thread, {
                    borderWidth: indexMap.indexOf(down) === index ? 1 : 0
                }]}>
                    <View style={styles.threadHead}>
                        <Text style={styles.threadId}>#{item.no}</Text>
                        <Text style={styles.threadName}>{item.name}: </Text>
                        <Text style={styles.threadSub}>{item.sub}</Text>
                    </View>
                    {processFiles(board, item, true, onSelect)}
                    {processEmbed(item, true)}
                    {'com_nomarkup' in item ? processCom(item.com_nomarkup, flatlistRef, indexMap) : null}
                </View>
            </View>
        </HoldItem>

    };

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
            <FlashList
                ref={flatlistRef}
                data={apiResponse}
                estimatedItemSize={200}
                contentContainerStyle={{paddingBottom: 20}}
                ItemSeparatorComponent={separator}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={getData} />
                }
                keyExtractor={keyExtractor}
                ListFooterComponent={
                    <View>
                        <TouchableHighlight onPress={() => {
                            setRefreshing(true);
                            getData();
                        }}>
                            <View style={styles.footerContainer}>
                                <Text style={styles.footerText}>{i18n.t('End')}</Text>
                                <View style={styles.footerActionContainer}>
                                    <Ionicons name='refresh' size={18} color='#53738e' />
                                    <Text style={styles.footerActionText}> Check updates</Text>
                                </View>
                            </View></TouchableHighlight>
                        {refreshing ? <ActivityIndicator /> : null}
                    </View>
                }
                renderItem={renderItem}
            />
            <SafeAreaView forceInset={{bottom: 'never'}} />
        </View>
    );
}

const selectedImagesPreview = (images) => {
    let is = [];
    for (const i in images) {
        let preview = <Image
            key={"upl_file_" + i}
            source={{uri: images[i].preview}}
            style={styles.filePreview.image.image}
            resizeMode={"cover"} />

        if (images[i].type === 'video') {
            preview = <View style={styles.filePreview.video.container}>
                <Ionicons name="videocam-outline" color="#ffffff" size={25} style={styles.filePreview.video.icon} />
                {preview}
            </View>
        }
        is.push(<View style={styles.filePreview.fileContainer}>{preview}</View>)
    }

    return is.length > 0 ? <View style={styles.filePreview.container}>{is}</View> : null
}

const processCom = (com, flatListRef, indexMap) => {
    if (com.length > 500) {
        //TODO: Post too long click to expand
    }

    return <View style={{maxHeight: 9000, margin: 10, marginBottom: 0}}>
        <Hyperlink linkStyle={styles.link} onPress={(url, text) => handleLinkPress(url)}>
            <Text style={[styles.threadCom]}>{formatCom(com, flatListRef, indexMap)}</Text>
        </Hyperlink>
    </View>
}

const processEmbed = (item, clickable) => {
    if ('embed' in item && item.embed !== null) {
        const yt = detectYoutube(item.embed) === false ? getYoutubeId(item.embed) : detectYoutube(item.embed);
        if (yt) { //TODO: vimeo, vocaroo, soundcloud, etc
            let image = <Image
                resizeMode={"cover"}
                style={styles.postImage}
                source={{
                    uri: 'https://img.youtube.com/vi/' + yt + '/0.jpg',
                }}
            />

            if (clickable) {
                image = <TouchableOpacity
                    style={{paddingTop: 15}}
                    onPress={() => handleLinkPress('https://www.youtube.com/watch?v=' + yt)}
                >{image}</TouchableOpacity>
            } else {
                image = <View style={{paddingTop: 15}}>{image}</View>
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
                    resizeMode={"cover"}
                    key={'post_image_' + item.no.toString()}
                    source={{
                        uri: HOST + '/' + board + '/thumb/' + firstImage.filename + '.png',
                    }}
                />)

            if (clickable) {
                image = [
                    <TouchableOpacity
                        style={{paddingTop: 15}}
                        key={'post_image_c_' + item.no.toString()}
                        onPress={() => onSelect(item.images, 0)}
                    >{image[0]}</TouchableOpacity>,
                    <View key={'post_image_meta_' + item.no.toString()} style={styles.threadImageContainer}>
                        <Text key={'post_image_p_' + item.no.toString()} style={[styles.threadImagesCount]}>1/{imagesCount}</Text>
                        <Text key={'post_image_t_' + item.no.toString()} style={[styles.threadImagesName]}>{firstImage.original}{firstImage.extension}</Text>
                    </View>
                ]
            } else {
                image = [
                    <View style={{paddingTop: 15}}>{image[0]}</View>
                ];
            }
        }

        for (const file in files) {//Only for video
            if (!['.webm', '.mp4'].includes(files[file].extension)) {
                continue;
            }

            image.push(
                <TouchableOpacity
                    style={{marginTop: 10}}
                    onPress={() => handleLinkPress(HOST + '/' + board + '/src/' + files[file].filename + files[file].extension)}
                >
                    <View style={styles.threadFile}>
                        <Ionicons name='cloud-download-outline' size={24} color="#FFFFFF" />
                        <Text style={styles.fileNameText}> {files[file].filename}{files[file].extension}</Text>
                    </View>
                </TouchableOpacity>)
        }
    }

    return image.length > 0 ? image : null;
}

const handleLinkPress = async (url) => {
    const supported = await Linking.canOpenURL(url);

    if (supported) {
        Linking.openURL(url);
    } else {
        Linking.openURL(url); //LOL
        //Alert.alert(`Don't know how to open this URL: ${url}`); //TODO: Request permission
    }
};

const getYoutubeId = (url) => {
    if (url.substring(0, 24) === 'https://youtu.be/') {
        return url.substring(17, 28);
    } else if (url.substring(0, 32) === 'https://www.youtube.com/watch?v=') {
        return url.substring(32, 43);
    }

    return false;
};

const detectYoutube = (str) => {
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

const NEW_HASHTAG_FORMATTER = (string, listRef, indexMap) => {

    //cit
    let NewString = reactStringReplace(string, /(>>[0-9]*)\s/gi, (match, i) => {
        const postId = parseInt(match.replace(' ', '').replace('>>', ''));
        return <TouchableOpacity
            onPress={() => indexMap.indexOf(postId) > -1 && typeof listRef !== 'undefined' ? listRef.current.scrollToIndex({
                animated: true,
                index: indexMap.indexOf(postId),
                viewOffset: 20,
            }) : null}
        ><Text style={styles.format.cit}>{match}</Text></TouchableOpacity>
    });

    //quote
    NewString = reactStringReplace(NewString, /(>.*)/gi, (match, i) => {
        return <Text style={styles.format.quote}>{match}</Text>
    })

    //bold
    NewString = reactStringReplace(NewString, /\[b\](.*)\[\/b\]/gi, (match, i) => {
        return <Text style={styles.format.bold}>{match}</Text>
    })
    //italic
    NewString = reactStringReplace(NewString, /\[i\](.*)\[\/i\]/gi, (match, i) => {
        return <Text style={styles.format.italic}>{match}</Text>
    })
    //underline
    NewString = reactStringReplace(NewString, /__(.*)__/gi, (match, i) => {
        return <Text style={styles.format.underline}>{match}</Text>
    })
    //strike
    NewString = reactStringReplace(NewString, /~~(.*)~~/gi, (match, i) => {
        return <Text style={styles.format.strike}>{match}</Text>
    })
    //head
    NewString = reactStringReplace(NewString, /==(.*)==/gi, (match, i) => {
        return <Text style={styles.format.head}>{match}</Text>
    })
    //spoiler
    NewString = reactStringReplace(NewString, /\*\*(.*)\*\*/gi, (match, i) => {
        return <Text style={styles.format.spoiler}>{match}</Text>
    })

    return NewString
}

const formatCom = (com, listRef, indexMap) => {
    return NEW_HASHTAG_FORMATTER(he.decode(com), listRef, indexMap);
}
