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
        height: "100%"
        // backgroundColor: '#fff',
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF7920',
        // backgroundColor: 'rgba(247,247,247,1.0)',
    },
    item: {
        color: '#fff',
        width: "100%",
        padding: 10,
        marginLeft: 20,
        fontSize: 18,
        height: 44,
    },
    threadCom: {
        color: '#fff',
        backgroundColor: '#000',
        padding: 10,
        fontSize: 14,
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
        marginBottom: 10,
    },
    threadName: {
        color: '#bc802f',
        paddingTop: 10,
        paddingBottom: 10,
        fontSize: 12,
    },
    threadId: {
        color: '#868686',
        padding: 10,
        fontSize: 12,
    },
    threadSub: {
        color: '#a9a9a9',
        paddingTop: 10,
        paddingBottom: 10,
        fontSize: 12,
    },
    itemThread: {
        color: '#fff',
        padding: 10,
        fontSize: 18,
        height: 100,
        borderBottomColor: '#646464',
        borderBottomWidth: 5,
    },
    postImage: {
        height: 200,
        marginTop: 10,
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
    }
});

export default styles;
