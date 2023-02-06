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
                        <Lottie
                            ref={animationRef}
                            style={{width: size, height: size}}
                            source={props.lottieSource}
                            autoPlay={true}
                            autoSize={false}
                            loop={false}
                            onAnimationFinish={() => {
                                setTimeout(() => {
                                    props.hideModal()
                                }, 'timeout' in props ? props.timeout : 0)
                            }}
                        />
                        {'title' in props ?
                            <Text style={{color: '#fff', fontWeight: 'bold'}}>{props.title}</Text> : null}
                        {'message' in props ? <Text style={{color: '#fff'}}>{props.message}</Text> : null}
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
