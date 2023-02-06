import {StyleSheet} from "react-native";

const styles = StyleSheet.create({
    input: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
    },
    container: {
        flex: 1,
        width: "100%",
        height: "100%",
        // backgroundColor: '#fff',
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF7920',
        // backgroundColor: 'rgba(247,247,247,1.0)',
    },
    sectionHeaderContainer: {
        paddingTop: 2,
        paddingLeft: 10,
        paddingRight: 10,
        backgroundColor: '#000000',
        paddingBottom: 2,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    item: {
        color: '#fff',
        width: "100%",
        padding: 10,
        marginLeft: 20,
        fontSize: 18,
        height: 44,
    },
    thread: {
        flexDirection: 'column',
        flexWrap: 'wrap',
        width: '100%',
        backgroundColor: "#000000",
        borderStyle: 'dashed',
        borderColor: '#ffffff',
        borderWidth: 0
    },
    threadCom: {
        color: '#fff',
        backgroundColor: '#000',
        fontSize: 14,
        width: 'auto',
        paddingBottom: 15,
    },
    threadComContainer: {
        maxHeight: 150,
        width: '100%',
        marginLeft: 10,
        marginRight: 10,
        marginTop: 10
    },
    threadImagesCount: {
        color: '#04b8f1',
        fontSize: 12,
    },
    threadImagesName: {
        color: '#007599',
        fontSize: 12,
        marginLeft: 5
    },
    threadFile: {
        borderColor: '#fff',
        borderStyle: 'dotted',
        borderWidth: 1,
        borderRadius: 7,
        padding: 10,
        backgroundColor: "#282828",
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignSelf: 'flex-start',
    },
    threadName: {
        color: '#FF7920',
        fontSize: 12,
        marginLeft: 5
    },
    threadId: {
        color: '#868686',
        fontSize: 12,
        fontWeight: "bold"
    },
    threadBoard: {
        color: '#bc802f',
        fontSize: 12,
        fontWeight: "bold",
        marginRight: 5
    },
    threadAction: {
        color: '#a9a9a9',
        fontSize: 12,
        fontStyle: "italic",
    },
    threadSub: {
        color: '#a9a9a9',
        fontSize: 12,
        marginLeft: 5
    },
    threadHead: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
        paddingBottom: 0,
        width: "100%",
        backgroundColor: "#000000",
    },
    postImage: {
        height: 200,
        width: '100%'
    },
    root: {
        backgroundColor: "#00000077"
    },
    space: {
        width: 45,
        height: 45
    },
    closeButton: {
        width: 45,
        height: 45,
        alignItems: "center",
        justifyContent: "center"
    },
    closeText: {
        lineHeight: 25,
        fontSize: 25,
        paddingTop: 2,
        includeFontPadding: false,
        color: "#FFF"
    },
    text: {
        maxWidth: 240,
        marginTop: 12,
        flex: 1,
        flexWrap: "wrap",
        textAlign: "center",
        fontSize: 17,
        lineHeight: 17,
        color: "#FFF"
    },
    separator: {
        height: 1,
        width: '100%',
        borderBottomColor: '#4f4f4f',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    footerContainer: {
        height: 160, justifyContent: 'center', alignItems: 'center'
    },
    footerText: {
        color: '#848484'
    },
    footerActionContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignSelf: 'center', marginTop: 10, justifyContent: 'center', alignItems: 'center'
    },
    footerActionText: {
        color: '#53738e'
    },
    notContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center'
    },
    notText: {
        color: '#848484'
    },
    headerActionContainer: {
        paddingRight: 10
    },
    headTitleText: {
        fontSize: 90, marginTop: 30, fontWeight: "bold", color: '#ffffff'
    },
    link: {
        color: '#ff7920'
    },
    threadImageContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignSelf: 'flex-start',
        backgroundColor: "#000",
        marginLeft: 10
    },
    fileNameText: {
        fontSize: 16,
        paddingTop: 0,
        paddingBottom: 10,
        margin: 0,
        color: '#c1c1c1',
        alignSelf: 'flex-start',
    },
    format: {
        cit: {color: '#ff7920', fontWeight: 'bold'},
        quote: {color: '#68a454'},
        bold: {fontWeight: "bold"},
        italic: {fontStyle: 'italic'},
        underline: {textDecorationLine: 'underline'},
        strike: {textDecorationLine: 'line-through', textDecorationStyle: 'solid'},
        head: {
            color: '#ff7920',
            fontWeight: 'bold',
            fontSize: 18,
            textTransform: 'uppercase'
        },
        spoiler: {color: '#282828', fontStyle: 'italic', textDecorationStyle: 'double'}
    },
    filePreview: {
        container: {flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10},
        fileContainer: {marginRight: 5},
        image: {
            image: {
                width: 100,
                height: 100,
            }
        },
        video: {
            container: {
                borderRadius: 5,
                borderWidth: 1,
                borderColor: '#ffffff',
                borderStyle: 'dotted'
            },
            icon: {
                position: 'absolute',
                top: 2,
                left: 5,
                zIndex: 999
            }
        }
    },
    postForm: {
        container: {
            marginHorizontal: 20,
            height: "100%",
        },
        keyboardContainer: {
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
        },
        scrollContainer: {width: "100%"},
        input: {
            subject: {
                container: {
                    backgroundColor: '#fff',
                    borderBottomColor: '#000000',
                    borderBottomWidth: 1,
                    marginBottom: 0,
                    marginTop: 10
                },
                input: {padding: 10, backgroundColor: '#131313', color: '#ffffff', borderWidth: 1,}
            },
            post: {
                container: {
                    backgroundColor: '#fff',
                    borderBottomColor: '#000000',
                    borderBottomWidth: 1,
                    marginBottom: 15,
                },
                input: {
                    padding: 10,
                    height: 300,
                    backgroundColor: '#131313', color: '#ffffff', borderWidth: 1,
                }
            },
            captcha: {}
        },
        button: {
            files: {
                container: {backgroundColor: '#333333', marginVertical: 10},
                button: {color: '#fff'}
            },
            submit: {
                container: {backgroundColor: '#333333', marginVertical: 10},
                button: {color: '#fff', fontWeight: 'bold'}
            },
        },
        captcha: {
            hintText: {color: '#6B6B6B'},
            image: {
                width: 250,
                height: 80,
            }
        },

    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 22,
    },
    modalView: {
        margin: 20,
        backgroundColor: '#2a2a2a',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTransView: {
        margin: 20,
        elevation: 5,
        padding: 35,
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    modalText: {
        marginBottom: 15,
        color: '#fff',
        textAlign: 'center',
    },
    modalLinks: {
        marginBottom: 5,
        textAlign: 'center',
        textDecorationStyle: 'solid',
        textDecorationColor: '#000',
        color: '#ff7920',
    },
    button: {
        borderRadius: 20,
        padding: 10,
        elevation: 2,
    },
    buttonClose: {
        backgroundColor: '#ff7920',
        marginTop: 10
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default styles;
