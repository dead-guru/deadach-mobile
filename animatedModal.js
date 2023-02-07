import React, {useEffect, useRef} from 'react';
import Lottie from 'lottie-react-native';
import {Modal, StyleSheet, Text, TouchableOpacity, View} from "react-native";

const LottieModal = (props) => {
    const animationRef = useRef(null)

    useEffect(() => {
        animationRef.current?.play()
    }, [])

    const size = 'size' in props ? props.size : 150

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={true}
        >
            <TouchableOpacity style={[styles.modalBackDrop, {backgroundColor: 'bgColor' in props ? props.bgColor : 'rgba(0, 0, 0, 0.5)'}]} activeOpacity={1} onPress={() => props.hideModal()}>
                <View style={styles.centeredView}>
                    <View style={styles.modalTransView}>
                        {'lottieSource' in props ? <Lottie
                            ref={animationRef}
                            style={{width: size, height: size}}
                            source={props.lottieSource}
                            autoPlay={'autoPlay' in props ? props.autoPlay : true}
                            autoSize={'autoSize' in props ? props.autoSize : false}
                            loop={'loop' in props ? props.loop : false}
                            onAnimationFinish={() => {
                                setTimeout(() => {
                                    props.hideModal()
                                }, 'timeout' in props ? props.timeout : 0)
                            }}
                        /> : null}
                        {'title' in props ?
                            <Text style={{color: '#fff', fontWeight: 'bold'}}>{props.title}</Text> : null}
                        {'message' in props ?
                            <Text style={{
                                color: '#fff',
                                justifyContent: 'center',
                                alignItems: 'center',
                                alignSelf: 'center',
                                textAlign: 'center',
                            }}>{props.message}</Text> : null}
                        <Text style={{
                            color: '#b9b9b9',
                            marginTop: 20,
                            justifyContent: 'center',
                            alignItems: 'center',
                            alignSelf: 'center',
                            textAlign: 'center',
                            fontSize: 10,
                        }}>{'dismissText' in props ? props.dismissText : 'Click anywhere to dismiss'}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

export default LottieModal;
const styles = StyleSheet.create({
    modalBackDrop: {
        flex: 1
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 22,
    },
    modalTransView: {
        margin: 20,
        elevation: 5,
        padding: 35,
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
});
