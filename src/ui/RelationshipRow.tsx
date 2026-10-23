import React from 'react';
import { Pressable, View } from 'react-native';
import { type Person } from '../game/model';
import { Portrait, StatTrack } from './components';
import { useFeedbackPress } from './feedback';
import { type Colors, useColors } from './theme';
import { DisplayText as Text, displayText } from './DisplayText';

export function affectionColor(value: number, colors: Colors) {
  return value < 35 ? colors.red : value < 70 ? colors.amber : colors.green;
}

/** Name, role and affection belong beside the portrait and form one tap target. */
export function RelationshipRow({ person, name, role, age, strength, onPress, first, last }: {
  person: Person; name: string; role: string; age: number; strength: number;
  onPress: () => void; first: boolean; last: boolean;
}) {
  const c = useColors(), press = useFeedbackPress(onPress);
  const detail = role + (person.died ? ' · Deceased' : ' · Age ' + age);
  return <Pressable accessibilityRole="button" accessibilityLabel={displayText(`${name}. ${detail}. Bond ${strength}%`)}
    onPress={press} style={({pressed})=>({minHeight:100,padding:14,flexDirection:'row',alignItems:'center',gap:14,
      backgroundColor:pressed?c.selected:c.surface,borderBottomWidth:last?0:1,borderBottomColor:c.line,
      borderTopLeftRadius:first?18:0,borderTopRightRadius:first?18:0,borderBottomLeftRadius:last?18:0,borderBottomRightRadius:last?18:0})}>
    <Portrait decorative name={name} personId={person.id} appearance={person.appearance} age={age} size={64} />
    <View style={{flex:1,minWidth:0,gap:6}}>
      <Text style={{color:c.ink,fontWeight:'600',fontSize:16}}>{name}</Text>
      <Text style={{color:c.muted,fontSize:13,lineHeight:18}}>{detail}</Text>
      <StatTrack value={strength} color={affectionColor(strength,c)} decorative />
    </View>
    <Text allowFontScaling={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{color:c.muted,fontSize:24}}>›</Text>
  </Pressable>;
}
