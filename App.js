import 'react-native-gesture-handler';
import {enableScreens} from 'react-native-screens';
import {
    ActivityIndicator,
    Alert,
    Button,
    FlatList,
    Image,
    Linking,
    RefreshControl,
    SafeAreaView,
    SectionList,
    StyleSheet,
    Text,
    TextInput,
    TouchableHighlight,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {DarkTheme, DefaultTheme, NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import {createStackNavigator} from '@react-navigation/stack';
import he from 'he'
import Hyperlink from 'react-native-hyperlink'
import ImageView from 'react-native-image-viewing'

import styles from './styles';

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

function PostForm({route, navigation}) {

    const {board, thread} = route.params;

    let title = 'New Post for /' + board + '/';

    if (thread !== null) {
        title = 'New Comment for /' + board + '/ #' + thread;
    }

    navigation.setOptions({
        title: title
    });

    return (
        <SafeAreaView style={{marginHorizontal: 30}}>
            {thread === null ? <View
                style={{
                    backgroundColor: '#fff',
                    borderBottomColor: '#000000',
                    borderBottomWidth: 1,
                    marginBottom: 15,
                }}>
                <TextInput
                    editable
                    multiline
                    numberOfLines={4}
                    maxLength={40}
                    onChangeText={text => console.log(text)}
                    placeholder={"Subject"}
                    style={{padding: 10}}
                /></View> : null}
            <View style={{backgroundColor: '#333333'}}>
                <Button
                    style={{color: '#fff'}}
                    title="Add Files"
                    onPress={() => {
                        Alert.alert('Soon...');
                    }}
                />
            </View>
            <View
                style={{
                    backgroundColor: '#fff',
                    borderBottomColor: '#000000',
                    borderBottomWidth: 1,
                    marginBottom: 15,
                }}>
                <TextInput
                    editable
                    multiline
                    numberOfLines={10}
                    maxLength={15000}
                    onChangeText={text => console.log(text)}
                    placeholder={"Post"}
                    style={{padding: 10, height: 300}}
                /></View>
            <View style={{backgroundColor: '#1c2814'}}>
                <Button
                    style={{color: '#fff'}}
                    title="Create"
                    onPress={() => {
                        Alert.alert('Soon...');
                    }}
                />
            </View>
        </SafeAreaView>
    );
}

function Home({navigation}) {
    return (
        <Tab.Navigator
            initialRouteName="List"
            screenOptions={({route}) => ({
                headerRight: () => (
                    route.name === 'Board' ?
                        <TouchableHighlight onPress={() => {
                            navigation.navigate('Form')
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
                    } else if (route.name === 'Settings') {
                        iconName = focused ? 'settings' : 'settings-outline';
                    }

                    // You can return any component that you like here!
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
            {/*<Tab.Screen name="Settings" component={SettingsScreen} listeners={() => ({
                tabPress: () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                },
            })} />*/}
        </Tab.Navigator>
    );
}

function SettingsScreen() {
    return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <Text>Settings!</Text>
        </View>
    );
}

function BoardsScreen({navigation}) {
    const [apiResponse, setApiResponse] = useState([]);

    useEffect(() => {
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
            // navigation.setOptions({tabBarBadge: ss.length})
        });
    }, [])
    return (
        <View style={styles.container}>
            <SectionList
                contentContainerStyle={{paddingBottom: 100}}
                sections={apiResponse}
                renderItem={({item}) => <TouchableOpacity
                    key={item.board}
                    onPress={() => navigation.navigate('Board', {
                        board: item.board
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
    let board;
    if (typeof route.params === 'object' && 'board' in route.params) {
        board = route.params.board;
    } else {
        return (
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <Text style={{color: '#848484'}}>Please, select board first!</Text>
            </View>
        );
    }

    const [apiResponse, setApiResponse] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const getData = () => {
        getBoardThreadsWithBody(board).then((res) => {
            setApiResponse(res);
            setRefreshing(false);
            navigation.setOptions({
                title: 'Board \\' + board + '\\',
                headerRight: () => {
                    return <TouchableHighlight onPress={() => {
                        navigation.navigate('Form', {board: board, thread: null})
                    }}>
                        <View style={{paddingRight: 10}}>
                            <Ionicons name='create' size={24} color='#FF7920' />
                        </View>
                    </TouchableHighlight>
                }
            });
        }).catch(error => {
            console.error(error);
        });
        return true;
    }

    useEffect(() => {
        getData();
    }, [board, refreshing]);

    return (
        <View style={styles.container}>

            {refreshing ? <ActivityIndicator /> : null}
            <FlatList
                contentContainerStyle={{paddingBottom: 100}}
                style={{width: '100%'}}
                data={apiResponse}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={getData} />
                }
                renderItem={({item}) =>
                    <TouchableOpacity
                        key={item.no}
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
                            <Text style={[styles.threadCom]}>{formatCom(item.com)}</Text>
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
    const {board, thread} = route.params;

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

    const getData = () => {
        getBoardThreadFromApi(board, thread).then((res) => {
            for (const post in res) {
                let images = [];
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
            navigation.setOptions({
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

            setApiResponse(res);
            setRefreshing(false);
        }).catch(error => {
            console.error(error);
        });
    };
    useEffect(() => {
        getData();
    }, [board, thread, refreshing]);


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
                keyExtractor={(item, index) => ("post-" + item.no)}
                contentContainerStyle={{paddingBottom: 20}}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={getData} />
                }
                renderItem={({item, index}) => <View key={"v_post-" + item.no} style={{
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
                    {'com' in item ? <View style={{maxHeight: 400}}>
                        <Hyperlink linkStyle={{color: '#ff7920'}} onPress={(url, text) => handleLinkPress(url)}>
                            <Text style={[styles.threadCom]}>{formatCom(item.com, flatlistRef, index)}</Text>
                        </Hyperlink>
                    </View> : null}
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
                    key={item.no}
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
                    key={firstImage.filename}
                    source={{
                        uri: 'https://4.dead.guru/' + board + '/thumb/' + firstImage.filename + '.png',
                    }}
                />)

            if (clickable) {
                image = [<TouchableOpacity
                    key={item.no}
                    onPress={() => onSelect(item.images, 0)}
                >{image[0]}</TouchableOpacity>,
                    <View style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        alignSelf: 'flex-start',
                    }}><Text style={[styles.threadImagesCount]}>1/{imagesCount}</Text>
                        <Text style={[styles.threadImagesName]}>{firstImage.original}{firstImage.extension}</Text></View>]
            }
        }

        for (const file in files) {
            if (!['.webm', '.mp4'].includes(files[file].extension)) {
                continue;
            }

            image.push(<TouchableOpacity
                key={files[file].filename}
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

const HASHTAG_FORMATTER = (string, listRef, index) => {
    return string.split(/(>>[0-9]*)\s/gi).filter(Boolean).map((v, i) => {
        if (v.includes('>>')) {
            return <TouchableOpacity
                key={v}
                onPress={() => typeof listRef !== 'undefined' ? listRef.current.scrollToIndex({
                    animated: true,
                    index: index - 1,
                    viewOffset: 20,
                }) : console.log(listRef)}
            ><Text key={i} style={{color: '#ff7920', fontWeight: 'bold'}}>{v.replace(' ', '')}</Text></TouchableOpacity>
        } else {
            return <Text key={i}>{v}</Text>
        }
    })
};

const formatCom = (com, listRef, index) => {
    return HASHTAG_FORMATTER(he.decode(com.replace('<br/>', "\n").replace(/<[^>]+>/g, ' ')), listRef, index);
}

const getBoarsFromApi = () => {
    return fetch('https://4.dead.guru/boards.php')
        .then(response => response.json())
        .then(json => {
            return json;
        })
        .catch(error => {
            console.error(error);
        });
};

const getBoardThreadsFromApi = (board) => {
    return fetch('https://4.dead.guru/' + board + '/threads.json' + '?random_number=' + new Date().getTime())
        .then(response => response.json())
        .then(json => {
            return json[0]['threads'];
        })
        .catch(error => {
            console.error(error);
        });
}

const getBoardThreadsWithBody = (board) => {
    return new Promise((resolve, reject) => {
        fetch('https://4.dead.guru/' + board + '/threads.json' + '?random_number=' + new Date().getTime())
            .then(response => response.json())
            .then(async json => {
                let threads = [];
                for (const thread of json[0]['threads']) {
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

const getBoardThreadFromApi = (board, thread) => {
    return fetch('https://4.dead.guru/' + board + '/res/' + thread + '.json' + '?random_number=' + new Date().getTime())
        .then(response => response.json())
        .then(json => {
            return json['posts'];
        })
        .catch(error => {
            console.error(error);
        });
}
